from collections.abc import Iterable
from decimal import Decimal
from pathlib import Path
from typing import Any
import json
import logging
import subprocess


logger = logging.getLogger(__name__)
ffmpeg_path = "/usr/bin/ffmpeg"

subtitle_languages = ("eng", "fre", "ger")  # ISO 639-2/B (eng, ger, fre...)

small_video_bitrate = 3_000_000
small_video_height = 720


def get_movies_to_convert(input_dir: Path) -> Iterable[Path]:
    for path in input_dir.iterdir():
        if path.is_file() and path.stem.endswith(".original"):
            yield path


def add_moov_atom(input_file: Path, output_file: Path):
    # Add moov atom at the begining to allow streaming/seeking
    subprocess.check_output(
        [
            ffmpeg_path,
            "-i",
            str(input_file),
            "-c:v",
            "copy",
            "-movflags",
            "+faststart+frag_keyframe+empty_moov",
            "-loglevel",
            "error",
            "-strict",
            "-2",
            "-y",
            str(output_file),
        ]
    )


def convert_to_small_h264(input_file: Path, output_file: Path):
    """
    Converts a video to a format that can be played on the web
    """
    return subprocess.check_output(
        [
            ffmpeg_path,
            "-i",
            str(input_file),
            "-preset",  # Slower conversion, smaller output file
            "slow",
            "-maxrate",  # Limit total bit rate
            str(small_video_bitrate),
            "-bufsize",
            str(int(small_video_bitrate * 1.5)),
            "-crf",  # Sacrifice some quality for smaller files
            "24",
            "-codec:a",  # Audio: AAC codec, best compatibility
            "aac",
            "-b:a",  # Audio: Reasonable quality
            "128k",
            "-ac",  # Audio: Stereo
            "2",
            "-ar",  # Audio: Standardize sample rate
            "44100",
            "-af",  # Audio: Keep in sync with video
            "aresample=async=1",
            "-codec:v",  # Video: H.264 codec, best compatibility
            "libx264",
            "-filter:v",  # Video: Downscale to correct resolution, but do not upscale
            f"scale=-2:min(ih\\,{small_video_height})",
            "-movflags",  # Enable skipping and instant streaming
            "+faststart+frag_keyframe+empty_moov",
            "-threads",  # Multithreading
            "0",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "mp4",
            str(output_file),
        ]
    )


def convert_to_large_h264(input_file: Path, output_file: Path):
    large_video_height = 2160
    return subprocess.check_output(
        [
            ffmpeg_path,
            "-i",
            str(input_file),
            "-preset",  # Slower conversion, smaller output file
            "slow",
            "-crf",  # Keep good quality
            "20",
            "-codec:a",  # Audio: AAC codec, best compatibility
            "aac",
            "-b:a",  # Audio: Reasonable quality
            "192k",
            "-ac",  # Audio: Stereo
            "2",
            "-af",  # Audio: Keep in sync with video
            "aresample=async=1",
            "-codec:v",  # Video: H.264 codec, best compatibility
            "libx264",
            "-filter:v",  # Video: Downscale to correct resolution, but do not upscale
            f"scale=-2:min(ih\\,{large_video_height})",
            "-movflags",  # Enable skipping and instant streaming
            "+faststart+frag_keyframe+empty_moov",
            "-threads",  # Multithreading
            "0",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "mp4",
            str(output_file),
        ]
    )


def get_video_metadata(file: Path) -> dict[str, Any]:
    # Get original video metadata
    ffprobe_output = json.loads(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=format_name,duration:stream=bit_rate,width,height,codec_name",
                "-of",
                "json",
                str(file),
            ],
        ).decode("utf-8")
    )
    return {
        "format": ffprobe_output["format"]["format_name"],
        "total_bitrate": sum(int(s.get("bit_rate", 0)) for s in ffprobe_output["streams"]),
        "duration": int(Decimal(ffprobe_output["format"]["duration"])),
    }


def convert_movie(input_file: Path):
    """
    Converts an input file to a video that can be streamed in a web browser.

    The converted movie has the same name, but the .small.mp4 and .large.mp4 extensions

    While it converts, it has the .converting.*.mp4 extension.
    """
    base_name = input_file.stem.rstrip(".original")
    tmp_file = input_file.with_name(base_name + ".converting.mp4")
    large_output_file = input_file.with_name(base_name + ".large.mp4")
    small_output_file = input_file.with_name(base_name + ".small.mp4")

    original_metadata = get_video_metadata(input_file)
    logger.info(
        f"Processing {str(input_file)}:\n"
        f"- Output file: {large_output_file} then {small_output_file}\n"
        f"- Format: {original_metadata['format']}\n"
        f"- Duration: {original_metadata['duration']}\n"
        f"- Bitrate: {original_metadata['total_bitrate']}\n"
    )

    logger.info(f"Extracting subtitles from {input_file}")
    extract_subtitles(input_file)

    logger.info(f"Converting {input_file} to {large_output_file}")
    convert_to_large_h264(input_file, tmp_file)
    large_output_file.unlink(missing_ok=True)
    tmp_file.rename(large_output_file)

    large_video_bitrate = get_video_metadata(large_output_file)["total_bitrate"]
    logger.info(f"Bitrate of {large_output_file} is {large_video_bitrate}")

    if large_video_bitrate >= small_video_bitrate * 1.25:
        logger.info(f"Converting {large_output_file} to {small_output_file}")
        convert_to_small_h264(large_output_file, tmp_file)
        small_output_file.unlink(missing_ok=True)
        tmp_file.rename(small_output_file)
    else:
        logger.info(f"Skipping conversion to {small_output_file} because the large version is small enough.")
        small_output_file.hardlink_to(large_output_file)

    logger.info(f"Conversion finished. Deleting original at {input_file}.")
    input_file.unlink(missing_ok=True)


def get_subtitles_to_convert(input_dir: Path) -> Iterable[Path]:
    for path in input_dir.iterdir():
        if (
            path.is_file()
            # File is a subtitles file
            and path.suffix.lower() == ".srt"
            # No .vtt subtitles exist
            and not path.with_suffix(".vtt").exists()
        ):
            yield path


def convert_subtitles_to_vtt(input_file: Path):
    output_file = Path(input_file).with_suffix(".vtt")
    ffmpeg_command = [ffmpeg_path, "-y", "-loglevel", "error", "-i", str(input_file), str(output_file)]
    try:
        logger.info(f"Converting {input_file} subtitles to .vtt")
        subprocess.check_output(ffmpeg_command)
    except subprocess.CalledProcessError as e:
        logger.exception(f"Could not convert subtitles in {input_file}. {e.output.decode('utf-8')}")
        raise


def extract_subtitles(input_file: Path):
    """
    Extract subs in .srt and .vtt format
    https://nicolasbouliane.com/blog/ffmpeg-extract-subtitles
    """
    ignored_subtitle_codecs = (
        "dvd_subtitle",
        "hdmv_pgs_subtitle",
        "ass",
    )

    # Find subtitle tracks by language. You could use ffmpeg's -map to find subtitle tracks by language, but it fails if
    # there are many tracks with the same language (for example subtitles + closed captions)
    subtitle_streams = json.loads(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "stream=index,width,codec_name:stream_tags=language",  # ISO 639-2/B (eng, ger, fre...)
                "-select_streams",
                "s",  # subtitle streams only
                "-of",
                "json",
                str(input_file),
            ]
        ).decode("utf-8")
    )["streams"]

    ffmpeg_command = [ffmpeg_path, "-y", "-loglevel", "error", "-i", str(input_file)]

    processed_subtitle_languages = set()
    for subtitle_stream in subtitle_streams:
        try:
            stream_index = subtitle_stream["index"]
            language_code = subtitle_stream["tags"].get("language", subtitle_languages[0])
        except KeyError:
            logger.error(f"Could not read metadata from subtitle stream in {input_file.name}: {subtitle_stream}")
            continue

        if (
            "width" in subtitle_stream  # Image-based subtitles can't be converted to text
            or subtitle_stream["codec_name"] in ignored_subtitle_codecs  # Unsupported codec
            or language_code in processed_subtitle_languages  # There is already a subtitle stream for this language
            or language_code not in subtitle_languages  # Not one of the desired languages
        ):
            continue

        processed_subtitle_languages.add(language_code)

        for suffix in (".srt", ".vtt"):
            subs_output_file = input_file.with_suffix(f".{language_code}{suffix}")
            logger.info(f"Extracting {language_code} subtitles to {str(subs_output_file)}")
            ffmpeg_command.extend(["-map", f"0:{stream_index}", str(subs_output_file)])

    if len(processed_subtitle_languages) > 0:
        try:
            logger.info(f"Extracting all subtitles from {input_file.name}")
            subprocess.check_output(ffmpeg_command)
        except subprocess.CalledProcessError as e:
            logger.exception(f"Could not extract subtitles from {input_file.name}. {e.output.decode('utf-8')}")
            raise
    else:
        logger.info(f"No subtitles found in {input_file.name}")
