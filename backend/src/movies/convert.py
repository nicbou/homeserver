from collections.abc import Iterable
from django.conf import settings
from pathlib import Path
import json
import logging
import os
import subprocess


logger = logging.getLogger(__name__)
ffmpeg_path = '/usr/bin/ffmpeg'

max_video_bitrate = 3000000
default_video_height = 720

subtitle_languages = ('eng', 'fre', 'ger')  # ISO 639-2/B (eng, ger, fre...)


def get_movies_to_convert(input_dir: Path) -> Iterable[Path]:
    for path in input_dir.iterdir():
        if (
            path.is_file()

            # File is a video
            and path.suffix.lower().endswith(settings.VIDEO_EXTENSIONS)

            # File is not a converting/converted video
            and not path.stem.lower().endswith(('.converting', '.converted'))

            # No converted video exists
            and not path.with_suffix('.converted.mp4').exists()
        ):
            yield path


def is_video_streamable(input_file: Path) -> bool:
    # Check if faststart is enabled (https://stackoverflow.com/a/46895695/1067337)
    return subprocess.check_output([
        'mediainfo', '--Inform=General;%IsStreamable%', str(input_file)
    ]).decode('utf-8').strip() == 'Yes'


def add_moov_atom(input_file: Path, output_file: Path):
    # Add moov atom at the begining to allow streaming/seeking
    subprocess.check_output([
        ffmpeg_path,
        '-i', str(input_file),
        '-c:v', 'copy',
        '-movflags', 'faststart',
        '-loglevel', 'warning',
        '-strict', '-2',
        '-y',
        str(output_file)
    ])


def convert_to_h264(input_file: Path, output_file: Path):
    """
    Converts a video to a format that can be played on the web
    """
    return subprocess.check_output([
        ffmpeg_path,
        '-i', str(input_file),
        '-codec:v', 'libx264',
        '-profile:v', 'high',
        '-preset', 'fast',
        '-movflags', 'faststart',  # Moves metadata to start, to allow streaming and skipping
        '-maxrate', str(max_video_bitrate),
        '-bufsize', str(max_video_bitrate * 1.5),
        '-filter:v', f"scale=-2:'min({default_video_height},ih)'",
        '-threads', '0',
        '-ac', '2',  # Stereo audio
        '-af', 'aresample=async=1',  # Keep audio in sync with video
        '-loglevel', 'warning',
        '-codec:a', 'aac',
        '-y',
        '-f', 'mp4',
        str(output_file)
    ])


def convert_movie(input_file: Path):
    """
    Converts an input file to a video that can be streamed in a web browser.

    The converted movie has the same name, but the .converted.mp4 extension

    While it converts, it has the .converting.mp4 extension.

    If a video is already streamable, a hard link to the original is created instead.
    """
    tmp_file = input_file.with_suffix('.converting.mp4')
    tmp_file.unlink(missing_ok=True)

    output_file = input_file.with_suffix('.converted.mp4')
    output_file.unlink(missing_ok=True)

    # Get original video metadata
    ffprobe_output = json.loads(subprocess.check_output(
        [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=format_name,duration:stream=bit_rate,width,height,codec_name',
            '-of', 'json',
            str(input_file),
        ],
    ).decode('utf-8'))
    video_streams = ffprobe_output['streams']
    video_format = ffprobe_output['format']
    total_bitrate = sum(int(s.get('bit_rate', 0)) for s in video_streams)
    has_mp4_container = 'mp4' in video_format['format_name'].split(',')
    has_aac_audio = any(s.get('codec_name') == 'aac' for s in video_streams)
    has_h264_video = any(s.get('codec_name') == 'h264' for s in video_streams)
    has_correct_codecs = has_mp4_container and has_h264_video and has_aac_audio

    is_streamable = is_video_streamable(input_file)

    logger.info(f'Processing {str(input_file)}:\n'
                f"- Output file: {str(tmp_file.name)} then {str(output_file.name)}\n"
                f"- Bitrate: {total_bitrate}\n"
                f"- Streamable: {is_streamable}\n"
                f"- Format: {video_format['format_name']}\n"
                f"- Streams: {video_streams}")

    has_correct_bitrate = total_bitrate <= max_video_bitrate

    if has_correct_codecs and has_correct_bitrate:
        if is_streamable:
            try:
                logger.info(f'Original video is already streamable. Hard linking "{str(input_file.name)}" to "{str(output_file.name)}"')
                os.link(input_file, output_file)
            except:
                logger.exception(f'Failed to hard link original video "{str(input_file.name)}" to "{str(output_file.name)}"')
                raise
        else:
            try:
                logger.info(f'Original video has right format, but is not streamable. '
                            f'Adding moov atom to "{str(input_file.name)}".')
                add_moov_atom(input_file, output_file)

                logger.info(f"Replacing original at {str(input_file.name)}, with the streamable version")
                os.unlink(input_file)
                os.link(output_file, input_file)
            except:
                logger.exception(f'Failed to add moov atom to "{str(input_file.name)}"')
                raise
    else:
        try:
            logger.info(f'Converting "{str(input_file.name)}" to "{str(tmp_file.name)}"')
            convert_to_h264(input_file, tmp_file)
            logger.info(f'Conversion of {str(tmp_file.name)} successful. Renaming to {str(output_file.name)}')
            tmp_file.rename(output_file)
        except subprocess.CalledProcessError as exc:
            logger.exception(f'Failed to convert "{str(input_file.name)}" to "{str(output_file.name)}"\n'
                             f'Output: {exc.output.decode("utf-8")}')
            raise

    extract_subtitles(input_file)


def extract_subtitles(input_file: str):
    """
    Extract subs in .srt and .vtt format
    https://nicolasbouliane.com/blog/ffmpeg-extract-subtitles
    """
    ignored_subtitle_codecs = (
        'dvd_subtitle',
        'hdmv_pgs_subtitle',
        'ass',
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
            language_code = subtitle_stream['tags'].get('language', subtitle_languages[0])
        except KeyError:
            logger.error(f"Could not read metadata from subtitle stream in {str(input_file.name)}: {subtitle_stream}")
            continue

        if (
            'width' in subtitle_stream  # Image-based subtitles can't be converted to text
            or subtitle_stream['codec_name'] in ignored_subtitle_codecs  # Unsupported codec
            or language_code in processed_subtitle_languages  # There is already a subtitle stream for this language
            or language_code not in subtitle_languages  # Not one of the desired languages
        ):
            continue

        processed_subtitle_languages.add(language_code)

        if language_code == subtitle_languages[0]:
            output_file_srt = Path(input_file).with_suffix('.srt')
            output_file_vtt = Path(input_file).with_suffix('.vtt')
        else:
            output_file_srt = Path(input_file).with_suffix(f".{language_code}.srt")
            output_file_vtt = Path(input_file).with_suffix(f".{language_code}.vtt")

        ffmpeg_command.extend([
            '-map', f'0:{stream_index}', str(output_file_srt),
            '-map', f'0:{stream_index}', str(output_file_vtt),
        ])
        logger.info(f'Extracting {language_code} subs to {str(output_file_srt.name)} and {str(output_file_vtt.name)}')

    if len(processed_subtitle_languages) > 0:
        try:
            logger.info(f"Extracting all subtitles from {str(input_file.name)}")
            subprocess.check_output(ffmpeg_command)
        except subprocess.CalledProcessError as e:
            logger.exception(f"Could not extract subtitles from {str(input_file.name)}. {e.output.decode('utf-8')}")
            raise
    else:
        logger.info(f"No subtitles found in {str(input_file.name)}")
