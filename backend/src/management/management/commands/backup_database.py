from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from shutil import copy
import logging


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Creates dated database backups, deletes old backups"

    def handle(self, *args, **options):
        try:
            settings.DATABASE_BACKUPS_PATH.mkdir(parents=True, exist_ok=True)
            backup_file = settings.DATABASE_BACKUPS_PATH / (timezone.now().strftime("%Y-%m-%d") + ".db")
            logger.info(f"Backing up database to {str(backup_file)}")
            copy(settings.DATABASE_PATH, backup_file)

            one_month_ago = datetime.now() - relativedelta(months=1)
            for file in settings.DATABASE_BACKUPS_PATH.iterdir():
                if file.is_file():
                    try:
                        file_date = timezone.make_aware(
                            datetime.strptime(file.stem, "%Y-%m-%d"), timezone.get_current_timezone()
                        )
                        if file_date.date() < one_month_ago.date():
                            logger.info(f"Removing old database backup at {str(file)}")
                            file.unlink()
                    except ValueError:
                        pass
        except Exception:
            logger.exception("Database backup failed")
        else:
            logger.info("Database backup complete")
