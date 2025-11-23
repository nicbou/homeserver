from django.conf import settings
from django.db import migrations


def rename_files(apps, schema_editor):
    # movie.srt -> movie.eng.srt
    vtt_files = list(settings.MOVIE_LIBRARY_PATH.glob("*.vtt"))
    for vtt_file in vtt_files:
        if not vtt_file.stem.endswith((".ger", ".fre")):
            vtt_file.rename(vtt_file.with_suffix(".eng.vtt"))

    srt_files = list(settings.MOVIE_LIBRARY_PATH.glob("*.srt"))
    for srt_file in srt_files:
        if not srt_file.stem.endswith((".ger", ".fre")):
            srt_file.rename(srt_file.with_suffix(".eng.srt"))


class Migration(migrations.Migration):
    dependencies = [
        ("movies", "0017_delete_episodeaccesstoken"),
    ]

    operations = [
        migrations.RunPython(rename_files),
    ]
