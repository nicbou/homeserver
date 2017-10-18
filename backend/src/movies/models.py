#!/usr/bin/env python
# -*- coding: utf-8 -*-
from django.db import models
from django.conf import settings
import os
import urllib
from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver


class Movie(models.Model):
    NOT_CONVERTED = 0
    CONVERTING = 1
    CONVERSION_FAILED = 2
    CONVERTED = 3
    status_choices = (
        (NOT_CONVERTED, 'not-converted'),
        (CONVERTING, 'converting'),
        (CONVERSION_FAILED, 'conversion-failed'),
        (CONVERTED, 'converted'),
    )

    # File
    original_extension = models.CharField(max_length=12, null=True)
    conversion_status = models.SmallIntegerField(default=NOT_CONVERTED, choices=status_choices)

    # Movie
    title = models.CharField(max_length=75)
    description = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True)
    release_year = models.CharField(max_length=4, blank=True)
    imdb_id = models.CharField(max_length=12, null=True)
    part = models.SmallIntegerField(null=True, blank=True)

    # Library
    date_added = models.DateField(auto_now_add=True)
    last_watched = models.DateField(default=None, blank=True, null=True)
    stopped_at = models.PositiveIntegerField(default=0)

    def __unicode__(self):
        return self.title

    def filename(self, extension='mp4'):
        filename = u'{title} ({year}).{extension}'
        if self.part:
            filename = u'{title} ({year}) part {part}.{extension}'
        return filename.format(
            extension=extension,
            part=self.part,
            year=self.release_year,
            title=self.title.replace('/', '-'),
        )

    @property
    def original_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.filename(self.original_extension))

    @property
    def converted_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.filename('converted.mp4'))

    @property
    def srt_subtitles_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.filename('srt'))

    @property
    def vtt_subtitles_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.filename('vtt'))

    @property
    def cover_path(self):
        return os.path.join(settings.MOVIE_LIBRARY_PATH, self.filename('jpg'))

    @property
    def original_url(self):
        return "{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=urllib.urlencode(self.filename(self.original_extension))
        )

    @property
    def converted_url(self):
        return "{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=urllib.urlencode(self.filename('converted.mp4'))
        )

    @property
    def srt_subtitles_url(self):
        return "{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=urllib.urlencode(self.filename('srt'))
        )

    @property
    def vtt_subtitles_url(self):
        return "{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=urllib.urlencode(self.filename('vtt'))
        )

    @property
    def cover_url(self):
        return "{url}/{file}".format(
            url=settings.MOVIE_LIBRARY_URL,
            file=urllib.urlencode(self.filename('jpg'))
        )


@receiver(pre_delete, sender=Movie)
def movie_delete(sender, instance, **kwargs):
    files_to_delete = [
        instance.original_path,
        instance.converted_path,
        instance.srt_subtitles_path,
        instance.vtt_subtitles_path,
        instance.cover_path,
    ]

    # Delete the renamed movie
    for path in files_to_delete:
        try:
            os.unlink(path)
        except:
            pass
