import contextlib
import json
import logging
import os
import shlex
import subprocess

import chardet
import requests
from pycaption import CaptionConverter, WebVTTWriter, SRTReader, CaptionReadNoCaptions

logger = logging.getLogger(__name__)


# Prevents escaping of HTML in subtitles
WebVTTWriter._encode = lambda self, s: s


def convert_to_mp4(input_file: str, output_file: str, callback_url: str):
    """Convert input_file to MP4, saves it to output_file."""
    max_video_bitrate = int(os.environ.get('MAX_VIDEO_BITRATE', 3000000))
    default_video_height = int(os.environ.get('MAX_VIDEO_HEIGHT', 720))
    ffmpeg_path = '/usr/local/bin/ffmpeg'

    # Get original video metadata
    ffprobe_output = subprocess.check_output(
        [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=format_name,duration:stream=bit_rate,width,height,codec_name',
            '-of', 'json',
            input_file,
        ],
    )
    video_streams = json.loads(ffprobe_output.decode('utf-8'))['streams']
    video_format = json.loads(ffprobe_output.decode('utf-8'))['format']
    total_bitrate = sum(int(s.get('bit_rate', 0)) for s in video_streams)
    has_mp4_container = 'mp4' in video_format['format_name'].split(',')
    has_aac_audio = any(s.get('codec_name') == 'aac' for s in video_streams)
    has_h264_video = any(s.get('codec_name') == 'h264' for s in video_streams)

    # Check if faststart is enabled (https://stackoverflow.com/a/46895695/1067337)
    is_streamable = subprocess.check_output([
        'mediainfo', '--Inform=General;%IsStreamable%', input_file
    ]).decode('utf-8').strip() == 'Yes'

    logger.info(f'Processing {input_file}:\n'
                f"- Output file: {output_file}\n"
                f"- Bitrate: {total_bitrate}\n"
                f"- Streamable: {is_streamable}\n"
                f"- Format: {video_format['format_name']}\n"
                f"- Streams: {video_streams}")

    with contextlib.suppress(FileNotFoundError):
        os.unlink(output_file)

    if has_mp4_container and has_h264_video and has_aac_audio and total_bitrate <= max_video_bitrate:
        # Instead of converting this video, hardlink it to its parent
        if not is_streamable:
            try:
                logger.info(f'Original video is already streamable. Hard linking "{input_file}" to "{output_file}"')
                os.link(input_file, output_file)
                requests.post(callback_url, json={'status': 'converted'})
            except:
                logger.exception(f'Failed to hard link original video "{input_file}" to "{output_file}"')
                requests.post(callback_url, json={'status': 'conversion-failed'})
                raise
        # Add moov atom at the begining to allow streaming/seeking
        else:
            try:
                logger.info(f'Original video has right format, but is not streamable. '
                            f'Adding moov atom to "{input_file}".')
                subprocess.check_output([
                    ffmpeg_path,
                    '-i', input_file,
                    '-c:v', 'copy',
                    '-movflags', 'faststart',
                    '-loglevel', 'warning',
                    '-strict', '-2',
                    output_file
                ])

                logger.info(f"Replacing original at {input_file}, with the streamable version")

                assert Path(output_file).exists(), f"Output file {output_file} does not exist"
                os.unlink(input_file)
                os.link(output_file, input_file)

                requests.post(callback_url, json={'status': 'converted'})
            except:
                logger.exception(f'Failed to add qt-faststart to "{input_file}"')
                requests.post(callback_url, json={'status': 'conversion-failed'})
                raise
    else:
        try:
            logger.info(f'Converting "{input_file}" to "{output_file}"')
            subprocess.check_output([
                ffmpeg_path,
                '-i', input_file,
                '-codec:v', 'libx264',
                '-profile:v', 'high',
                '-preset', 'fast',
                '-movflags', 'faststart',  # Moves metadata to start, to allow streaming
                '-maxrate', str(max_video_bitrate),
                '-bufsize', str(max_video_bitrate * 1.5),
                '-filter:v', f"scale=-2:'min({default_video_height},ih)'",
                '-threads', '0',
                '-ac', '2',  # Stereo audio
                '-af', 'aresample=async=1',  # Keep audio in sync with video
                '-loglevel', 'warning',
                '-codec:a', 'libfdk_aac',
                '-f', 'mp4', output_file
            ])
            logger.info(f'Conversion of {input_file} successful')
            requests.post(callback_url, json={'status': 'converted'})
        except subprocess.CalledProcessError as exc:
            logger.exception(f'Failed to convert "{input_file}" to "{output_file}"\n'
                             f'Output: {exc.output.decode("utf-8")}')
            requests.post(callback_url, json={'status': 'conversion-failed'})
            raise


def convert_subtitles_to_vtt(input_file: str, output_file: str):
    """Convert .srt subtitles to .vtt for web playback."""
    logger.info(f'Converting {input_file} to {output_file}')
    with open(input_file, mode='rb') as raw_input_content:
        encoding = chardet.detect(raw_input_content.read())['encoding']

    with open(input_file, mode='r', encoding=encoding) as srt_file:
        srt_contents = str(srt_file.read())

    converter = CaptionConverter()
    try:
        converter.read(srt_contents, SRTReader())
    except CaptionReadNoCaptions:
        logger.exception(f'Failed to convert {input_file} to {output_file}')
        return False  # Likely UTF-16 subtitles
    vtt_captions = converter.write(WebVTTWriter())

    with open(output_file, mode='w', encoding='utf-8-sig') as vtt_file:
        vtt_file.write(vtt_captions)

    return True


def extract_mkv_subtitles(input_file: str):
    """
    Extract .srt subtitles from an .mkv file.

    The English subtitles are called input_file.srt, and the other subtitles are
    called input_file.lang.srt, unless there is only one subtitle track.

    :param input_file: .mkv file absolute path
    :returns: True if subtitles were found and extracted, False otherwise
    """
    logger.info(f"Extracting subtitles from {input_file}")
    try:
        mkvmerge_output = subprocess.check_output([
            'mkvmerge',
            '--identify',
            '--identification-format', 'json',
            input_file
        ])
    except subprocess.CalledProcessError:
        logger.exception("Could not extract subtitles from MKV file")
        raise

    json_tracks = json.loads(mkvmerge_output.decode('utf-8')).get('tracks', [])

    tracks_to_extract = {}
    for track in json_tracks:
        if (
            track.get('type') == 'subtitles' and
            track['properties'].get('enabled_track') and
            track['properties'].get('text_subtitles')
        ):
            track_language = track['properties'].get('language', '').lower()
            tracks_to_extract[track_language] = tracks_to_extract.get(track_language, [])
            tracks_to_extract[track_language].append(track)

    logger.info(f"Found {len(tracks_to_extract)} subtitle tracks to extract")

    # Extract the first available track for each language
    language_count = len(tracks_to_extract.keys())
    for language, tracks in tracks_to_extract.items():
        # Title.mkv -> Title.fre.srt or Title.srt
        extension = f".{language}.srt" if language != 'eng' and language_count > 1 else '.srt'

        subtitles_output_file = "{path}{extension}".format(
            path=".".join(input_file.split('.')[0:-1]),
            extension=extension
        )

        if len(tracks) > 0:
            logger.info(f"Extracting {language} subtitles to {subtitles_output_file}")
            subprocess.check_output(
                ['mkvextract', 'tracks', input_file, f"{tracks[0]['id']}:{shlex.quote(subtitles_output_file)}"]
            )

    return language_count > 1
