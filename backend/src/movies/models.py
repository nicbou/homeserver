#!/usr/bin/env python
# -*- coding: utf-8 -*-
import logging
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver

logger = logging.getLogger(__name__)


class Episode(models.Model):
    NOT_CONVERTED = 0
    CONVERTING = 1
    CONVERTED = 3

    TV_SHOW = 1
    MOVIE = 2

    type_choices = (
        (TV_SHOW, "tv"),
        (MOVIE, "movie"),
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
    duration = models.IntegerField(null=True, blank=True, default=None)

    # Library
    date_added = models.DateField(auto_now_add=True)

    def __str__(self):
        return str(self.base_filename())

    def base_filename(self, extension=None, episode_number=True) -> Path:
        filename = "{title} ({year})"
        if episode_number and (self.season or self.episode):
            filename = "{title} ({year}) {season}{episode}"

        if extension:
            filename = filename + extension

        return Path(
            filename.format(
                season="S{}".format(self.season) if self.season else "",
                episode="E{}".format(self.episode) if self.episode else "",
                year=self.release_year,
                title=self.title.replace("/", "-").replace(":", ","),
            )
        )

    @property
    def original_filename(self):
        original_extension = Path(self.triage_path).suffix
        return self.base_filename(f".original{original_extension}")

    @property
    def cover_filename(self) -> Path:
        return self.base_filename(".jpg", episode_number=False)

    @property
    def temporary_video_filename(self) -> Path:
        return self.base_filename(".converting.mp4")

    @property
    def small_video_filename(self) -> Path:
        return self.base_filename(".small.mp4")

    @property
    def large_video_filename(self) -> Path:
        return self.base_filename(".large.mp4")

    def subtitles_filename(self, extension=".srt", language_code="eng") -> Path:
        return self.base_filename(f".{language_code}{extension}")

    def subtitles_path(self, extension=".srt", language_code="eng") -> Path:
        return settings.MOVIE_LIBRARY_PATH / self.subtitles_filename(extension, language_code)

    def subtitles_url(self, extension=".srt", language_code="eng") -> str:
        return f"{settings.MOVIE_LIBRARY_URL}/{self.subtitles_filename(extension, language_code)}"

    @property
    def conversion_status(self):
        if self.temporary_video_path.exists():
            return self.CONVERTING
        elif self.small_video_path.exists():
            return self.CONVERTED
        else:
            return self.NOT_CONVERTED

    @property
    def has_large_version(self):
        # If the original file is small enough, the small and large video files are a
        # hard link to the same file.
        return (
            self.small_video_path.exists()
            and self.large_video_path.exists()
            and not self.small_video_path.samefile(self.large_video_path)
        )

    def __getattr__(self, attr) -> Path | str | None:
        if attr.endswith("_path"):
            filename = getattr(self, attr.removesuffix("_path") + "_filename")
            return settings.MOVIE_LIBRARY_PATH / filename
        elif attr.endswith("_url"):
            filename = getattr(self, attr.removesuffix("_url") + "_filename")
            return f"{settings.MOVIE_LIBRARY_URL}/{filename}"


@receiver(pre_delete, sender=Episode)
def episode_delete(sender, instance: Episode, **kwargs):
    files_to_delete = list(settings.MOVIE_LIBRARY_PATH.glob(str(instance.base_filename("*"))))

    # All episodes share the same cover
    # If deleting the last episode, delete the cover
    episode_count = Episode.objects.filter(tmdb_id=instance.tmdb_id).count()
    if episode_count == 1:
        files_to_delete.append(instance.cover_path)

    for path in files_to_delete:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.warning(f"Could not delete file {str(path)}")


class EpisodeWatchStatus(models.Model):
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    stopped_at = models.PositiveIntegerField(default=0)
    last_watched = models.DateField(default=None, blank=True, null=True)

    def __str__(self):
        return "{} for user {}".format(self.episode.title, self.user)

    class Meta:
        unique_together = (("episode", "user"),)


class StarredMovie(models.Model):
    tmdb_id = models.CharField(max_length=12, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return "{} for user {}".format(self.tmdb_id, self.user)

    class Meta:
        unique_together = (("tmdb_id", "user"),)
