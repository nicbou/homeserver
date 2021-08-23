import contextlib
import json
import logging
import os
import subprocess
from pathlib import Path

import requests

logger = logging.getLogger(__name__)
ffmpeg_path = '/usr/local/bin/ffmpeg'


def convert_to_mp4(input_file: str, output_file: str, callback_url: str):
    """Convert input_file to MP4, saves it to output_file."""
    max_video_bitrate = int(os.environ.get('MAX_VIDEO_BITRATE', 3000000))
    default_video_height = int(os.environ.get('MAX_VIDEO_HEIGHT', 720))

    # Get original video metadata
    ffprobe_output = json.loads(subprocess.check_output(
        [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=format_name,duration:stream=bit_rate,width,height,codec_name',
            '-of', 'json',
            input_file,
        ],
    ).decode('utf-8'))
    video_streams = ffprobe_output['streams']
    video_format = ffprobe_output['format']
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
                    '-y',
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
                '-y',
                '-f', 'mp4',
                output_file
            ])
            logger.info(f'Conversion of {input_file} successful')
            requests.post(callback_url, json={'status': 'converted'})
        except subprocess.CalledProcessError as exc:
            logger.exception(f'Failed to convert "{input_file}" to "{output_file}"\n'
                             f'Output: {exc.output.decode("utf-8")}')
            requests.post(callback_url, json={'status': 'conversion-failed'})
            raise


def extract_subtitles(input_file: str):
    """
    Extract subs in .srt and .vtt format
    https://nicolasbouliane.com/blog/ffmpeg-extract-subtitles
    """
    ignored_subtitle_codecs = (
        'dvd_subtitle',
        'hdmv_pgs_subtitle',
    )

    # Find subtitle tracks by language. You could use ffmpeg's -map to find subtitle tracks by language, but it fails if
    # there are many tracks with the same language (for example subtitles + closed captions)
    subtitle_streams = json.loads(subprocess.check_output([
        'ffprobe',
        '-v', 'error',
        '-show_entries', 'stream=index,width,codec_name:stream_tags=language',  # ISO 639-2/B (eng, ger, fre...)
        '-select_streams', 's',  # subtitle streams only
        '-of', 'json',
        input_file,
    ]).decode('utf-8'))['streams']

    ffmpeg_command = [ffmpeg_path, '-y', '-loglevel', 'warning', '-i', input_file]

    processed_subtitle_languages = set()
    for subtitle_stream in subtitle_streams:
        try:
            stream_index = subtitle_stream['index']
            language_code = subtitle_stream['tags'].get('language', 'eng')
        except KeyError:
            logger.error(f"Could not read metadata from subtitle stream in {input_file}: {subtitle_stream}")
            continue

        if (
            'width' in subtitle_stream  # Image-based subtitles can't be converted to text
            or subtitle_stream['codec_name'] in ignored_subtitle_codecs  # Unsupported codec
            or language_code in processed_subtitle_languages  # There is already a subtitle stream for this language
        ):
            continue

        processed_subtitle_languages.add(language_code)

        output_file_srt = Path(input_file).with_suffix(f".{language_code}.srt" if language_code != 'eng' else '.srt')
        output_file_vtt = Path(input_file).with_suffix(f".{language_code}.vtt" if language_code != 'eng' else '.vtt')
        ffmpeg_command.extend([
            '-map', f'0:{stream_index}', str(output_file_srt),
            '-map', f'0:{stream_index}', str(output_file_vtt),
        ])
        logger.info(f'Found {language_code} subtitles track. Will extract to {output_file_srt} and {output_file_vtt}')

    if len(processed_subtitle_languages) > 0:
        try:
            logger.info(f"Extracting all subtitles from {input_file}")
            subprocess.check_output(ffmpeg_command)
        except subprocess.CalledProcessError as e:
            logger.exception(f"Could not extract subtitles from {input_file}. {e.output.decode('utf-8')}")
            raise
    else:
        logger.info(f"No subtitles found in {input_file}")
