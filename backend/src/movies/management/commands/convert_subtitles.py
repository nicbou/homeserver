#!/usr/local/bin/python
# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from movies.models import Episode
from django.conf import settings
import os
import requests


class Command(BaseCommand):
    help = 'Converts or reconverts the subtitles to .vtt'

    def add_arguments(self, parser):
        parser.add_argument('episode_id', type=int)

    def handle(self, *args, **options):
        episode = Episode.objects.get(pk=options['episode_id'])
        subtitles_paths_and_filenames = (
            (episode.srt_subtitles_path_en, episode.srt_subtitles_filename_en),
            (episode.srt_subtitles_path_de, episode.srt_subtitles_filename_de),
            (episode.srt_subtitles_path_fr, episode.srt_subtitles_filename_fr),
        )
        for srt_subtitles_path, srt_subtitles_filename in subtitles_paths_and_filenames:
            if os.path.exists(srt_subtitles_path.encode('utf-8')):
                api_url = "{host}/subtitlesToVTT".format(host=settings.VIDEO_PROCESSING_API_URL)
                requests.post(api_url, json={'input': srt_subtitles_filename})
