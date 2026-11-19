from datetime import date, timedelta
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
import logging
import sqlite3


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Creates dated database backups, deletes old backups"

    def handle(self, *args, **options):
        try:
            settings.DATABASE_BACKUPS_PATH.mkdir(parents=True, exist_ok=True)
            backup_file = settings.DATABASE_BACKUPS_PATH / (timezone.localdate().isoformat() + ".db")
            logger.info(f"Backing up database to {str(backup_file)}")
            backup_file.unlink(missing_ok=True)
            with sqlite3.connect(settings.DATABASE_PATH) as src:
                src.execute(f"VACUUM INTO '{backup_file}'")

            cutoff = date.today() - timedelta(days=30)
            for file in settings.DATABASE_BACKUPS_PATH.glob("*.db"):
                try:
                    if date.fromisoformat(file.stem) < cutoff:
                        logger.info(f"Removing old database backup at {str(file)}")
                        file.unlink()
                except ValueError:
                    pass
        except Exception:
            logger.exception("Database backup failed")
        else:
            logger.info("Database backup complete")
