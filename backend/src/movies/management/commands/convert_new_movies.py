from django.conf import settings
from django.core.management.base import BaseCommand
from movies.convert import get_videos_to_process, process_video
import logging
import time


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Converts all unconverted movies until stopped"

    def handle(self, *args, **options):
        while True:
            for movie_path in get_videos_to_process(settings.MOVIE_LIBRARY_PATH):
                try:
                    process_video(movie_path)
                except:
                    logger.exception(f"Could not convert video {str(movie_path)}")
            time.sleep(30)
