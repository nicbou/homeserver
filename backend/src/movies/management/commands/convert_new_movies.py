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
            for movie_path in get_movies_to_convert(settings.MOVIE_LIBRARY_PATH):
                try:
                    convert_movie(movie_path)
                except:
                    logger.exception(f"Could not convert video {str(movie_path)}")

            for subtitles_path in get_subtitles_to_convert(settings.MOVIE_LIBRARY_PATH):
                try:
                    convert_subtitles_to_vtt(subtitles_path)
                except:
                    logger.exception(f"Could not convert subtitles {str(subtitles_path)}")
            time.sleep(30)
