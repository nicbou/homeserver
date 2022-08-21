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
    CONVERSION_FAILED = 2
    CONVERTED = 3

    TV_SHOW = 1
    MOVIE = 2

    status_choices = (
        (NOT_CONVERTED, 'not-converted'),
        (CONVERTING, 'converting'),
        (CONVERSION_FAILED, 'conversion-failed'),
        (CONVERTED, 'converted'),
    )
    type_choices = (
        (TV_SHOW, 'tv'),
        (MOVIE, 'movie'),
    )
    status_map = {status[1]: status[0] for status in status_choices}

    # File
    triage_path = models.CharField(max_length=300, null=True)
    conversion_status = models.SmallIntegerField(default=NOT_CONVERTED, choices=status_choices)

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
        return self.filename(show_season=True)

    def filename(self, extension: str = None, show_season: bool = True):
        filename = u'{title} ({year}).{extension}'
        if show_season and (self.season or self.episode):
            filename = u'{title} ({year}) {season}{episode}.{extension}'

        return filename.format(
            extension=extension or Path(self.triage_path).suffix[1:],
            season='S{}'.format(self.season) if self.season else '',
            episode='E{}'.format(self.episode) if self.episode else '',
            year=self.release_year,
            title=self.title.replace('/', '-').replace(':', ','),
        )

    @property
    def original_is_same_as_converted(self):
        return (
            self.conversion_status == self.CONVERTED
            and self.original_path.suffix == '.mp4'
            and self.original_path.exists()  # Actual files might be missing in the dev environment
            and self.converted_path.exists()
            and self.original_path.stat().st_ino == self.converted_path.stat().st_ino
        )

    @property
    def original_filename(self) -> str:
        original_extension = Path(self.triage_path).suffix[1:]
        original_filename = self.filename(original_extension)

        # The original file might have been deleted, and replaced with the converted version to save space
        if self.conversion_status == self.CONVERTED and not (settings.MOVIE_LIBRARY_PATH / original_filename).exists():
            return str(Path(original_filename).with_suffix('.mp4'))

        return original_filename

    @property
    def original_path(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.original_filename

    @property
    def converted_filename(self) -> str:
        return self.filename('converted.mp4')

    @property
    def converted_path(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.converted_filename

    @property
    def temporary_conversion_filename(self) -> str:
        return self.filename('converted.mp4.tmp')

    @property
    def temporary_conversion_path(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.temporary_conversion_filename

    @property
    def srt_subtitles_filename_en(self) -> str:
        return self.filename('srt')

    @property
    def srt_subtitles_filename_de(self) -> str:
        return self.filename('ger.srt')

    @property
    def srt_subtitles_filename_fr(self) -> str:
        return self.filename('fre.srt')

    @property
    def srt_subtitles_path_en(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.srt_subtitles_filename_en

    @property
    def srt_subtitles_path_de(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.srt_subtitles_filename_de

    @property
    def srt_subtitles_path_fr(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.srt_subtitles_filename_fr

    @property
    def vtt_subtitles_filename_en(self) -> str:
        return self.filename('vtt')

    @property
    def vtt_subtitles_filename_de(self) -> str:
        return self.filename('ger.vtt')

    @property
    def vtt_subtitles_filename_fr(self) -> str:
        return self.filename('fre.vtt')

    @property
    def vtt_subtitles_path_en(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.vtt_subtitles_filename_en

    @property
    def vtt_subtitles_path_de(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.vtt_subtitles_filename_de

    @property
    def vtt_subtitles_path_fr(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.vtt_subtitles_filename_fr

    @property
    def cover_filename(self) -> str:
        return self.filename('jpg', show_season=False)

    @property
    def cover_path(self) -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.cover_filename

    @property
    def original_url(self) -> str:
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.original_filename
        )

    @property
    def converted_url(self) -> str:
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.converted_filename
        )

    @property
    def srt_subtitles_url_en(self) -> str:
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.srt_subtitles_filename_en
        )

    @property
    def srt_subtitles_url_de(self) -> str:
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.srt_subtitles_filename_de
        )

    @property
    def srt_subtitles_url_fr(self) -> str:
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.srt_subtitles_filename_fr
        )

    @property
    def vtt_subtitles_url_en(self) -> str:
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.vtt_subtitles_filename_en
        )

    @property
    def vtt_subtitles_url_de(self) -> str:
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.vtt_subtitles_filename_de
        )

    @property
    def vtt_subtitles_url_fr(self) -> str:
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.vtt_subtitles_filename_fr
        )

    @property
    def cover_url(self) -> str:
        """All episodes of a movie/show share the same cover."""
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.filename('jpg', show_season=False)
        )


@receiver(pre_delete, sender=Episode)
def episode_delete(sender, instance: Episode, **kwargs):
    files_to_delete = list(settings.MOVIE_LIBRARY_PATH.glob(instance.filename('*')))

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


class EpisodeAccessToken(models.Model):
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    expiration_date = models.DateTimeField(default=tomorrow)
    token = models.CharField(max_length=32, default=random_uuid)
