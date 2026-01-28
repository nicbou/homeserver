from django.db import migrations
from django.conf import settings
import logging


def rename_files(apps, schema_editor):
    for file_path in settings.MOVIE_LIBRARY_PATH.iterdir():
        # Skip directories and .jpg files
        if file_path.is_dir() or file_path.suffix.lower() == ".jpg":
            continue

        # .converting.mp4 -> .small.mp4
        elif file_path.name.endswith(".converted.mp4"):
            new_name = file_path.name.replace(".converted.mp4", ".small.mp4")
            logging.info(file_path.name + " ->>> " + new_name)
            file_path.rename(file_path.with_name(new_name))

        # original.mkv -> .orginal.mkv
        elif not (".original" in file_path.suffixes or file_path.name.endswith(".small.mp4")):
            original_suffix = file_path.suffix
            old_converted_path = file_path.with_suffix(".converted.mp4")
            new_converted_path = file_path.with_suffix(".small.mp4")
            if old_converted_path.exists() and file_path.samefile(old_converted_path):
                logging.info(file_path.name + " XXX")
                file_path.unlink()
            elif new_converted_path.exists() and file_path.samefile(new_converted_path):
                logging.info(file_path.name + " XXX")
                file_path.unlink()
            else:
                logging.info(file_path.name + " ->>> " + file_path.with_suffix(".original" + original_suffix).name)
                file_path.rename(file_path.with_suffix(".original" + original_suffix))


class Migration(migrations.Migration):
    dependencies = [
        ("movies", "0021_alter_episode_duration"),
    ]

    operations = [
        migrations.RunPython(rename_files),
    ]
