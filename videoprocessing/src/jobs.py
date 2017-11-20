import subprocess
import shlex
import json
import requests
from pycaption import CaptionConverter, WebVTTWriter, SRTReader, CaptionReadNoCaptions
import chardet


def convert_to_mp4(input_file, output_file, callback_url):
    """Convert input_file to MP4, saves it to output_file."""
    command = (u'/srv/src/convert.sh {input_path} {output_path}').format(
        input_path=shlex.quote(input_file),
        output_path=shlex.quote(output_file),
    )
    process = subprocess.Popen(command, shell=True)
    stdout, stderr = process.communicate()
    return_code = process.returncode

    if callback_url:
        if return_code == 0:
            requests.post(callback_url, json={'status': 'converted'})
        else:
            requests.post(callback_url, json={'status': 'conversion-failed'})

    return return_code


def convert_subtitles_to_vtt(input_file, output_file):
    """Convert .srt subtitles to .vtt for web playback."""
    with open(input_file, mode='rb') as raw_input_content:
        encoding = chardet.detect(raw_input_content.read())['encoding']

    with open(input_file, mode='r', encoding=encoding) as srt_file:
        srt_contents = str(srt_file.read())

    converter = CaptionConverter()
    try:
        converter.read(srt_contents, SRTReader())
    except CaptionReadNoCaptions:
        return False  # Likely UTF-16 subtitles
    vtt_captions = converter.write(WebVTTWriter())

    with open(output_file, mode='w', encoding='utf-8-sig') as vtt_file:
        vtt_file.write(vtt_captions)

    return True


def extract_mkv_subtitles(input_file, callback_url):
    """
    Extract .srt subtitles from an .mkv file.

    The English subtitles are called input_file.srt, and the other subtitles are
    called input_file.lang.srt, unless there is only one subtitle track.

    :param input_file: .mkv file absolute path
    :returns: True if subtitles were found and extracted, False otherwise
    """
    command = u'mkvmerge --identify-verbose --identification-format json {input_path}'.format(
        input_path=shlex.quote(input_file)
    )
    mkvmerge_output = subprocess.check_output(command, shell=True)
    json_tracks = json.loads(mkvmerge_output).get('tracks', [])

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

    # Extract the first available track for each language
    language_count = len(tracks_to_extract.keys())
    for language, tracks in tracks_to_extract.items():
        # Title.mkv -> Title.fre.srt or Title.srt
        extension = ".{language}.srt".format(language=language) if language != 'eng' and language_count > 1 else '.srt'

        subtitles_output_file = "{path}{extension}".format(
            path=".".join(input_file.split('.')[0:-1]),
            extension=extension
        )

        if len(tracks_to_extract[language]) > 0:
            command = u'mkvextract tracks {video_path} {track_id}:{srt_path}'.format(
                video_path=shlex.quote(input_file),
                track_id=tracks_to_extract[language][0]['id'],
                srt_path=shlex.quote(subtitles_output_file),
            )
            subprocess.Popen(command, shell=True).communicate()

    return language_count > 1
