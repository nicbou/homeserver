from django.core.management.base import BaseCommand
from movies.convert import get_video_metadata
from movies.models import Episode
import logging
import time


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Set the duration of all movies"

    def handle(self, *args, **options):
        for episode in Episode.objects.filter(duration=None):
            if episode.conversion_status != Episode.CONVERTED:
                continue
            logger.info(f"Setting duration of {episode}")
            try:
                episode.duration = get_video_metadata(episode.small_video_path)["duration"]
                logger.info(f"Duration: {episode.duration}")
            except:
                logger.exception("Could not get episode duration")
            episode.save()
        time.sleep(30)
