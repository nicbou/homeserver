from django.conf import settings
from django.core.management.base import BaseCommand
from movies.convert import get_movies_to_convert, convert_movie, get_subtitles_to_convert, convert_subtitles_to_vtt
import logging
import time


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Converts all unconverted movies until stopped"

    def handle(self, *args, **options):
        while True:
            for original_path in get_movies_to_convert(settings.MOVIE_LIBRARY_PATH):
                try:
                    convert_movie(original_path)
                except:
                    logger.exception(f"Could not convert movie {str(original_path)}")

            for original_path in get_subtitles_to_convert(settings.MOVIE_LIBRARY_PATH):
                try:
                    convert_subtitles_to_vtt(original_path)
                except:
                    logger.exception(f"Could not convert subtitles {str(original_path)}")
            time.sleep(30)
