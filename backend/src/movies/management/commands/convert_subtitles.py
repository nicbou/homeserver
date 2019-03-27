#!/usr/local/bin/python
# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from movies.models import Movie
from django.conf import settings
import os
import requests


class Command(BaseCommand):
    help = 'Converts or reconverts the subtitles to .vtt'

    def add_arguments(self, parser):
        parser.add_argument('movie_id', type=int)

    def handle(self, *args, **options):
        movie = Movie.objects.get(pk=options['movie_id'])
        subtitles_paths_and_filenames = (
            (movie.srt_subtitles_path_en, movie.srt_subtitles_filename_en),
            (movie.srt_subtitles_path_de, movie.srt_subtitles_filename_de),
            (movie.srt_subtitles_path_fr, movie.srt_subtitles_filename_fr),
        )
        for srt_subtitles_path, srt_subtitles_filename in subtitles_paths_and_filenames:
            if os.path.exists(srt_subtitles_path.encode('utf-8')):
                api_url = "{host}/subtitlesToVTT".format(host=settings.VIDEO_PROCESSING_API_URL)
                requests.post(api_url, json={'input': srt_subtitles_filename})
