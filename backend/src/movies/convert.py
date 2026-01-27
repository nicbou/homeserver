from collections.abc import Iterable
from decimal import Decimal
from pathlib import Path
from typing import Any
import json
import logging
import subprocess


logger = logging.getLogger(__name__)

ffmpeg_path = "/usr/bin/ffmpeg"
subtitle_languages = ("eng", "fre", "ger")  # ISO 639-2/B language codes
small_video_bitrate = 3_000_000
small_video_height = 720


def get_videos_to_process(input_dir: Path) -> Iterable[Path]:
    return [path for path in input_dir.iterdir() if path.is_file() and path.stem.endswith(".original")]


def convert_for_streaming(input_file: Path, output_file: Path, reduce_size=False):
    output_file.unlink(missing_ok=True)

    metadata = get_video_metadata(input_file)

    ffmpeg_params = [
        ffmpeg_path,
        "-i",
        str(input_file),
        "-preset",  # Slower conversion, smaller output file
        "slow",
        "-threads",  # Multithreading
        "0",
        "-loglevel",  # Suppress warnings and info
        "error",
        "-y",  # Don't ask for user input
        "-f",  # Use mp4 container
        "mp4",
    ]

    ffmpeg_params.extend(["-map", "0:a"])  # Audio: map all streams
    ffmpeg_params.extend(["-map", "0:v"])  # Video: map all streams
    ffmpeg_params.extend(["-map_chapters", "-1"])  # Chapters metadata: remove

    if metadata["has_aac_audio"] and metadata["has_h264_video"] and not reduce_size:
        # Copy the streams since they're already in the right format
        ffmpeg_params.extend(["-codec:a", "copy"])
        ffmpeg_params.extend(["-codec:v", "copy"])
    else:
        # Audio
        ffmpeg_params.extend(["-codec:a", "aac"])  # Best compatibility
        ffmpeg_params.extend(["-b:a", "128k"])  # Note: if the bitrate is smaller, it will be stretched
        ffmpeg_params.extend(["-ac", "2"])  # Stereo
        ffmpeg_params.extend(["-ar", "44100"])  # Audio sampling rate
        ffmpeg_params.extend(["-af", "aresample=async=1"])  # Sync audio with video

        # Video
        ffmpeg_params.extend(["-codec:v", "libx264"])  # Best compatibility
        ffmpeg_params.extend(["-crf", "24" if reduce_size else "21"])
        ffmpeg_params.extend(["-fps_mode", "cfr"])  # Enforce constant frame rate, because Airplay does not like VFR

        if reduce_size:
            ffmpeg_params.extend(["-filter:v", f"scale=-2:min(ih\\,{small_video_height})"])  # Cap resolution
            ffmpeg_params.extend(["-maxrate", str(small_video_bitrate)])  # Desired bitrate
            ffmpeg_params.extend(["-bufsize", str(small_video_bitrate * 1.5)])

    # Include all subtitles, converted for maximum compatibility
    if metadata["subtitle_streams"]:
        ffmpeg_params.extend(["-codec:s", "mov_text"])
        for stream in metadata["subtitle_streams"]:
            ffmpeg_params.extend(["-map", f"0:{stream['index']}"])

    # Add the moov atom to enable streaming
    ffmpeg_params.extend(["-movflags", "+faststart"])

    return subprocess.check_output([*ffmpeg_params, str(output_file)])


def get_video_metadata(file: Path) -> dict[str, Any]:
    ffprobe_output = json.loads(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=format_name,duration:stream=index,bit_rate,width,height,codec_name:stream_tags=language,title",
                "-of",
                "json",
                str(file),
            ],
        ).decode("utf-8")
    )

    subtitle_streams = json.loads(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "stream=index,width,codec_name:stream_tags=language,title",
                "-select_streams",
                "s",  # select subtitle streams only
                "-of",
                "json",
                str(file),
            ],
        ).decode("utf-8")
    )["streams"]

    ignored_subtitle_codecs = (
        "dvd_subtitle",
        "hdmv_pgs_subtitle",
    )
    supported_subtitle_streams = [
        {
            "index": s["index"],
            "codec_name": s["codec_name"],
            "language": s["tags"]["language"],
            "title": s["tags"].get("title"),
        }
        for s in subtitle_streams
        if "width" not in s  # No image-based subtitles
        and s["codec_name"] not in ignored_subtitle_codecs  # No unsupported codecs
    ]

    return {
        "format": ffprobe_output["format"]["format_name"],
        "total_bitrate": sum(int(s.get("bit_rate", 0)) for s in ffprobe_output["streams"]),
        "duration": int(Decimal(ffprobe_output["format"]["duration"])),
        "subtitle_streams": supported_subtitle_streams,
        "has_aac_audio": any(s.get("codec_name") == "aac" for s in ffprobe_output["streams"]),
        "has_h264_video": any(s.get("codec_name") == "h264" for s in ffprobe_output["streams"]),
    }


def process_video(input_file: Path):
    """
    Converts an input file to a video that can be streamed in a web browser.
    Extracts subtitles to separate files.

    The converted movie has the same name, but with a .small.mp4 and .large.mp4 extension

    While it converts, it has the .converting.* extension.
    """
    base_name = input_file.stem.rstrip(".original")
    tmp_file = input_file.with_name(base_name + ".converting.mp4")
    large_output_file = input_file.with_name(base_name + ".large.mp4")
    small_output_file = input_file.with_name(base_name + ".small.mp4")
    subtitle_file_template = str(input_file.with_name(base_name + ".{language_code}.{extension}"))

    original_metadata = get_video_metadata(input_file)
    subtitle_streams_str = ", ".join([s["language"] for s in original_metadata["subtitle_streams"]]) or "None"
    logger.info(
        f"Processing {str(input_file)}:\n"
        f"- Output file: {large_output_file.name} then {small_output_file.name}\n"
        f"- Format: {original_metadata['format']}\n"
        f"- Duration: {original_metadata['duration']}\n"
        f"- Bitrate: {original_metadata['total_bitrate']}\n"
        f"- Subtitles: {subtitle_streams_str}\n"
    )

    logger.info(f"Converting {input_file.name} to {large_output_file.name}")
    convert_for_streaming(input_file, tmp_file)
    large_output_file.unlink(missing_ok=True)
    tmp_file.rename(large_output_file)

    large_video_bitrate = get_video_metadata(large_output_file)["total_bitrate"]
    logger.info(f"Bitrate of {large_output_file.name} is {large_video_bitrate}")

    if large_video_bitrate >= small_video_bitrate * 1.25:
        logger.info(f"Converting {large_output_file.name} to {small_output_file.name}")
        convert_for_streaming(large_output_file, tmp_file, reduce_size=True)
        small_output_file.unlink(missing_ok=True)
        tmp_file.rename(small_output_file)
    else:
        logger.info(f"Renaming {large_output_file.name} to {small_output_file.name} because it's small enough.")
        large_output_file.rename(small_output_file)

    logger.info(f"Extracting .srt and .vtt subtitles from {input_file.name}")
    extract_subtitles(input_file, subtitle_file_template)

    logger.info(f"Conversion finished. Deleting original at {input_file.name}.")
    input_file.unlink(missing_ok=True)


def convert_subtitles_to_vtt(input_file: Path):
    output_file = Path(input_file).with_suffix(".vtt")
    output_file.unlink(missing_ok=True)
    ffmpeg_command = [ffmpeg_path, "-y", "-loglevel", "error", "-i", str(input_file), str(output_file)]
    try:
        logger.info(f"Converting {input_file.name} subtitles to .vtt")
        subprocess.check_output(ffmpeg_command)
    except subprocess.CalledProcessError as e:
        logger.exception(f"Could not convert subtitles in {input_file.name}. {e.output.decode('utf-8')}")
        raise


def extract_subtitles(input_file: Path, subtitle_file_template: str):
    """
    Extract subs to .srt and .vtt files
    https://nicolasbouliane.com/blog/ffmpeg-extract-subtitles
    """
    ffmpeg_command = [
        ffmpeg_path,
        "-y",
        "-loglevel",
        "error",
        "-i",
        str(input_file),
    ]

    processed_languages = set()  # If multiple streams have the same language, only process the first one
    for stream in get_video_metadata(input_file)["subtitle_streams"]:
        if stream["language"] not in subtitle_languages and stream["language"] not in processed_languages:
            logger.info(f"Ignoring {stream['language']} subtitles in {input_file.name}")
            continue

        processed_languages.add(stream["language"])
        for extension in ("srt", "vtt"):
            subtitle_file = subtitle_file_template.format(language_code=stream["language"], extension=extension)
            logger.info(f"Extracting {stream['language']} subtitles to {subtitle_file}")
            codec = {"vtt": "webvtt", "srt": "srt"}[extension]
            ffmpeg_command.extend(["-map", f"0:{stream['index']}", "-codec:s", codec, subtitle_file])

    if not len(processed_languages):
        return

    try:
        logger.info(f"Extracting all subtitles from {input_file.name}")
        subprocess.check_output(ffmpeg_command)
    except subprocess.CalledProcessError as e:
        logger.exception(f"Could not extract subtitles from {input_file.name}. {e.output.decode('utf-8')}")
        raise
