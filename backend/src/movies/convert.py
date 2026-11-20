from collections.abc import Iterable
from decimal import Decimal
from pathlib import Path
from typing import Any
import json
import logging
import subprocess


logger = logging.getLogger(__name__)

ffmpeg_path = "ffmpeg"
subtitle_languages = ("eng", "fre", "ger")  # ISO 639-2/B language codes
max_video_bitrate = 8_000_000
max_video_height = 1080


def get_videos_to_process(input_dir: Path) -> Iterable[Path]:
    return [
        path
        for path in input_dir.iterdir()
        if path.is_file()
        and ".original" in path.suffixes
        and not path.with_name(path.stem.removesuffix(".original") + ".converted.mp4").exists()
    ]


def get_subtitles_to_convert(input_dir: Path) -> Iterable[Path]:
    """
    User-uploaded .srt subtitles that don't have matching .vtt subtitles
    """
    return [
        path
        for path in input_dir.iterdir()
        if path.is_file() and path.suffix == ".srt" and not path.with_suffix(".vtt").exists()
    ]


def convert_for_streaming(input_file: Path, output_file: Path):
    output_file.unlink(missing_ok=True)

    metadata = get_video_metadata(input_file)

    has_compatible_audio = all(
        [s["codec_name"] == "aac" and s["sample_rate"] in ("44100", "48000") for s in metadata["audio_streams"]]
    )
    has_compatible_video = (
        metadata["video_streams"][0]["pix_fmt"] == "yuv420p" and metadata["video_streams"][0]["codec_name"] == "h264"
    )

    if has_compatible_video:
        logger.info(f"Video stream in {input_file.name} is already ok; copying instead of converting.")
        video_params = ["-codec:v", "copy"]
    else:
        video_params = [
            "-codec:v", "libx264",
            "-crf", "23",
            "-fps_mode", "cfr",
            "-filter:v", f"scale=-2:min(ih\\,{max_video_height})",
            "-maxrate", str(max_video_bitrate),
            "-bufsize", str(max_video_bitrate * 1.5),
            "-vf", "format=yuv420p",
        ]

    if has_compatible_audio and has_compatible_video:  # Compatible audio still needs to be synced with video
        logger.info(f"Audio stream in {input_file.name} is already ok; copying instead of converting.")
        audio_params = ["-codec:a", "copy"]
    else:
        audio_params = [
            "-codec:a", "aac",
            "-b:a", "128k",
            "-ac", "2",
            "-ar", "44100",
            "-filter:a", "aresample=async=1",
        ]

    subtitle_params = []
    if metadata["supported_subtitle_streams"]:
        subtitle_params = ["-codec:s", "mov_text"]
        for stream in metadata["supported_subtitle_streams"]:
            subtitle_params += ["-map", f"0:{stream['index']}"]

    ffmpeg_params = [
        ffmpeg_path,
        "-i", str(input_file),
        "-preset", "slow",
        "-threads", "0",
        "-loglevel", "error",
        "-y",
        "-f", "mp4",
        "-map", "0:a",
        "-map", "0:v:0",
        "-map_chapters", "-1",
        *video_params,
        *audio_params,
        *subtitle_params,
        "-movflags", "+faststart",
        str(output_file),
    ]

    return subprocess.check_output(ffmpeg_params)


def get_video_metadata(file: Path) -> dict[str, Any]:
    ffprobe_output = json.loads(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format:streams",
                "-of",
                "json",
                str(file),
            ],
        ).decode("utf-8")
    )

    audio_streams = [s for s in ffprobe_output["streams"] if s["codec_type"] == "audio"]
    video_streams = [s for s in ffprobe_output["streams"] if s["codec_type"] == "video"]
    subtitle_streams = [s for s in ffprobe_output["streams"] if s["codec_type"] == "subtitle"]

    ignored_subtitle_codecs = ("dvd_subtitle", "hdmv_pgs_subtitle")
    supported_subtitle_streams = [
        s
        for s in subtitle_streams
        if "width" not in s and s["codec_name"] not in ignored_subtitle_codecs  # No bitmap subs and unsupported codecs
    ]

    return {
        "format": ffprobe_output["format"]["format_name"],
        "total_bitrate": sum(int(s.get("bit_rate", 0)) for s in ffprobe_output["streams"]),
        "duration": int(Decimal(ffprobe_output["format"]["duration"])),
        "audio_streams": audio_streams,
        "video_streams": video_streams,
        "subtitle_streams": subtitle_streams,
        "supported_subtitle_streams": supported_subtitle_streams,
    }


def process_video(input_file: Path):
    """
    Converts an input file to a video that can be streamed in a web browser.
    Extracts subtitles to separate files.

    The converted movie has the same name, but with a .converted.mp4 extension

    While it converts, it has the .converting.* extension.
    """
    base_name = input_file.stem.removesuffix(".original")
    tmp_file = input_file.with_name(base_name + ".converting.mp4")
    output_file = input_file.with_name(base_name + ".converted.mp4")
    subtitle_file_template = str(input_file.with_name(base_name + ".{language_code}.{extension}"))

    metadata = get_video_metadata(input_file)
    subtitle_streams_str = ", ".join([s["tags"].get("language", "unknown") for s in metadata["subtitle_streams"]])
    supported_subtitle_streams_str = ", ".join(
        [s["tags"].get("language", "unknown") for s in metadata["supported_subtitle_streams"]]
    )
    logger.info(
        f"Processing {str(input_file)}:\n"
        f"- Output file: {output_file.name}\n"
        f"- Format: {metadata['format']}\n"
        f"- Duration: {metadata['duration']}\n"
        f"- Bitrate: {metadata['total_bitrate']}\n"
        f"- Subtitles: {subtitle_streams_str or 'None'}\n"
        f"    - Supported subtitles: {supported_subtitle_streams_str or 'None'}"
    )

    logger.info(f"Converting {input_file.name} to {output_file.name}")
    convert_for_streaming(input_file, tmp_file)
    output_file.unlink(missing_ok=True)
    tmp_file.rename(output_file)

    logger.info(f"Extracting .srt and .vtt subtitles from {input_file.name}")
    extract_subtitles(input_file, subtitle_file_template)

    for srt_file in get_subtitles_to_convert(input_file.parent):
        if srt_file.name.startswith(base_name):
            convert_subtitles_to_vtt(srt_file)

    logger.info(f"Conversion finished. Deleting original at {input_file.name}.")


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
        "-fix_sub_duration",
        "-y",
        "-loglevel",
        "error",
        "-i",
        str(input_file),
    ]

    processed_languages = set()  # If multiple streams have the same language, only process the first one
    for stream in get_video_metadata(input_file)["supported_subtitle_streams"]:
        lang = stream["tags"].get("language", "unknown")
        if lang not in subtitle_languages and lang not in processed_languages:
            logger.info(f"Ignoring {lang} subtitles in {input_file.name}")
            continue

        processed_languages.add(lang)
        for extension in ("srt", "vtt"):
            subtitle_file = subtitle_file_template.format(language_code=lang, extension=extension)
            logger.info(f"Extracting {lang} subtitles to {subtitle_file}")
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
