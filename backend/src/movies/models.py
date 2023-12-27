#!/usr/bin/env python
# -*- coding: utf-8 -*-
import datetime
import logging
import uuid
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver
from django.utils import timezone

logger = logging.getLogger(__name__)


class Episode(models.Model):
    NOT_CONVERTED = 0
    CONVERTING = 1
    CONVERTED = 3

    TV_SHOW = 1
    MOVIE = 2

    type_choices = (
        (TV_SHOW, 'tv'),
        (MOVIE, 'movie'),
    )

    # Path to the original file in the finished torrents directory
    # Use to remove triaged files from the triage list
    triage_path = models.CharField(max_length=300, null=True)

    # Episode
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    release_year = models.CharField(max_length=4, blank=True)
    tmdb_id = models.CharField(max_length=12, null=True)
    media_type = models.SmallIntegerField(default=MOVIE, choices=type_choices)
    season = models.SmallIntegerField(null=True, blank=True)
    episode = models.SmallIntegerField(null=True, blank=True)

    # Library
    date_added = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.base_filename()

    def base_filename(self, episode_number=True) -> Path:
        filename = u'{title} ({year})'
        if episode_number and (self.season or self.episode):
            filename = u'{title} ({year}) {season}{episode}'

        return Path(filename.format(
            season='S{}'.format(self.season) if self.season else '',
            episode='E{}'.format(self.episode) if self.episode else '',
            year=self.release_year,
            title=self.title.replace('/', '-').replace(':', ','),
        ))

    # Original file

    @property
    def original_filename(self) -> Path:
        original_extension = Path(self.triage_path).suffix
        original_filename = self.base_filename().with_suffix(original_extension)

        # When the original was replaced with the converted version
        if not (settings.MOVIE_LIBRARY_PATH / original_filename).exists():
            return original_filename.with_suffix('.mp4')

        return original_filename

    @property
    def original_path(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.original_filename

    @property
    def original_url(self) -> str:
        return f"{settings.MOVIE_LIBRARY_URL}/{self.original_filename}"

    # Converted file

    @property
    def converted_filename(self) -> Path:
        return self.base_filename().with_suffix('.converted.mp4')

    @property
    def converted_path(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.converted_filename

    @property
    def converted_url(self) -> str:
        return f"{settings.MOVIE_LIBRARY_URL}/{self.converted_filename}"

    # Subtitles

    def subtitles_filename(self, extension='.srt', language_code='eng') -> Path:
        if language_code == 'eng':
            return self.base_filename.with_suffix(extension)
        else:
            return self.base_filename.with_suffix(f'.{language_code}{extension}')

    def subtitles_path(self, extension='.srt', language_code='eng') -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.subtitles_filename(extension, language_code)

    def subtitles_url(self, extension='.srt', language_code='eng') -> str:
        return f"{settings.MOVIE_LIBRARY_URL}/{self.subtitles_filename(extension, language_code)}"

    # Cover image

    @property
    def cover_filename(self) -> Path:
        return self.base_filename(show_season=False).with_suffix('.jpg')

    @property
    def cover_path(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.cover_filename

    @property
    def cover_url(self) -> str:
        return f"{settings.MOVIE_LIBRARY_URL}/{self.cover_filename}"

    @property
    def conversion_status(self):
        if self.converted_path.exists():
            return self.CONVERTED
        elif self.original_path.with_suffix('.converting.mp4').exists:
            return self.CONVERTING
        else:
            return self.NOT_CONVERTED

    @property
    def original_is_same_as_converted(self):
        return (
            self.original_path.exists()
            and self.converted_path.exists()
            and self.original_path.stat().st_ino == self.converted_path.stat().st_ino
        )


@receiver(pre_delete, sender=Episode)
def episode_delete(sender, instance: Episode, **kwargs):
    files_to_delete = list(settings.MOVIE_LIBRARY_PATH.glob(instance.base_filename.with_suffix('*')))

    # All episodes share the same cover
    # If deleting the last episode, delete the cover
    episode_count = Episode.objects.filter(tmdb_id=instance.tmdb_id).count()
    if episode_count == 1:
        files_to_delete.append(instance.cover_path)

    for path in files_to_delete:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.warning(f'Could not delete file {str(path)}')


def tomorrow():
    return timezone.now() + datetime.timedelta(days=1)


def random_uuid() -> str:
    return uuid.uuid4().hex


class EpisodeWatchStatus(models.Model):
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    stopped_at = models.PositiveIntegerField(default=0)
    last_watched = models.DateField(default=None, blank=True, null=True)

    def __str__(self):
        return u"{} for user {}".format(self.episode.title, self.user)

    class Meta:
        unique_together = (('episode', 'user'),)


class StarredMovie(models.Model):
    tmdb_id = models.CharField(max_length=12, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return u"{} for user {}".format(self.tmdb_id, self.user)

    class Meta:
        unique_together = (('tmdb_id', 'user'),)
