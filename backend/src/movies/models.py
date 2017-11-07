#!/usr/bin/env python
# -*- coding: utf-8 -*-
from django.db import models
from django.conf import settings
import os
from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver


class Movie(models.Model):
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
        (CONVERSION_FAILED, 'conversion-failed'),
        (CONVERTED, 'converted'),
    )
    status_map = {status[1]: status[0] for status in status_choices}

    # File
    original_extension = models.CharField(max_length=12, null=True)
    triage_path = models.CharField(max_length=200, null=True)
    conversion_status = models.SmallIntegerField(default=NOT_CONVERTED, choices=status_choices)

    # Movie
    title = models.CharField(max_length=75)
    description = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True)
    release_year = models.CharField(max_length=4, blank=True)
    tmdb_id = models.CharField(max_length=12, null=True)
    media_type = models.SmallIntegerField(default=MOVIE, choices=type_choices)
    season = models.SmallIntegerField(null=True, blank=True)
    episode = models.SmallIntegerField(null=True, blank=True)

    # Library
    date_added = models.DateField(auto_now_add=True)
    last_watched = models.DateField(default=None, blank=True, null=True)
    stopped_at = models.PositiveIntegerField(default=0)

    def __unicode__(self):
        return self.title

    def filename(self, extension='mp4', show_season=True):
        filename = u'{title} ({year}).{extension}'
        if show_season and (self.season or self.episode):
            filename = u'{title} ({year}) {season}{episode}.{extension}'

        return filename.format(
            extension=extension,
            season='S{}'.format(self.season) if self.season else '',
            episode='E{}'.format(self.episode) if self.episode else '',
            year=self.release_year,
            title=self.title.replace('/', '-').replace(':', ','),
        )

    @property
    def library_filename(self):
        return self.filename(self.original_extension)

    @property
    def library_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.library_filename)

    @property
    def converted_filename(self):
        return self.filename('converted.mp4')

    @property
    def converted_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.converted_filename)

    @property
    def temporary_conversion_filename(self):
        return self.filename('converted.mp4.tmp')

    @property
    def temporary_conversion_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.temporary_conversion_filename)

    @property
    def srt_subtitles_filename(self):
        return self.filename('srt')

    @property
    def srt_subtitles_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.srt_subtitles_filename)

    @property
    def vtt_subtitles_filename(self):
        return self.filename('vtt')

    @property
    def vtt_subtitles_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.vtt_subtitles_filename)

    @property
    def cover_filename(self):
        return self.filename('jpg', show_season=False)

    @property
    def cover_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.cover_filename)

    @property
    def library_url(self):
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.filename(self.original_extension)
        )

    @property
    def converted_url(self):
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.filename('converted.mp4')
        )

    @property
    def srt_subtitles_url(self):
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.filename('srt')
        )

    @property
    def vtt_subtitles_url(self):
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.filename('vtt')
        )

    @property
    def cover_url(self):
        """All episodes of a movie/show share the same cover."""
        return u"{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=self.filename('jpg', show_season=False)
        )


@receiver(pre_delete, sender=Movie)
def movie_delete(sender, instance, **kwargs):
    files_to_delete = [
        instance.library_path,
        instance.converted_path,
        instance.srt_subtitles_path,
        instance.vtt_subtitles_path,
        instance.temporary_conversion_path,
    ]

    episode_count = Movie.objects.filter(tmdb_id=instance.tmdb_id).count()
    if episode_count == 1:
        files_to_delete.append(instance.cover_path)  # All episodes share the same cover

    # Delete the renamed movie
    for path in files_to_delete:
        try:
            os.unlink(path)
        except:
            pass
