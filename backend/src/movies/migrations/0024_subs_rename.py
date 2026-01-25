from django.db import migrations
from django.conf import settings


def rename_files(apps, schema_editor):
    for path in settings.MOVIE_LIBRARY_PATH.iterdir():
        # Fix mangled subtitle names from previous migration (film.original.eng.vtt -> film.eng.vtt)
        if path.suffix.lower() in (".srt", ".vtt") and ".original" in path.suffixes:
            suffixes = [s for s in path.suffixes if s != ".original"]
            new_name = path.name.removesuffix("".join(path.suffixes)) + "".join(suffixes)  # "file.eng.vtt"
            new_path = path.with_name(new_name)
            new_path.unlink(missing_ok=True)
            path.rename(new_path)


class Migration(migrations.Migration):
    dependencies = [
        ("movies", "0023_auto_20260117_1835"),
    ]

    operations = [
        migrations.RunPython(rename_files),
    ]
