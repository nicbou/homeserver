# -*- coding: utf-8 -*-
from pathlib import Path
from typing import List

from django.contrib.auth.mixins import PermissionRequiredMixin
from django.http import JsonResponse

from .models import Episode, EpisodeWatchStatus, StarredMovie
from django.views import View
from django.conf import settings
from django.db import transaction
import json
import logging
import os
import requests
import datetime


logger = logging.getLogger(__name__)


class MovieListView(PermissionRequiredMixin, View):
    permission_required = 'authentication.movies_watch'
    raise_exception = True

    def get(self, request, *args, **kwargs):
        """
        Return all movies/shows and their episodes as a nested list
        """
        movies_by_tmdb_id = {}

        watch_statuses = {wp.episode_id: wp for wp in EpisodeWatchStatus.objects.filter(user=request.user)}
        starred_movies = {s.tmdb_id: s for s in StarredMovie.objects.filter(user=request.user)}

        for movie in Episode.objects.all():
            if not movies_by_tmdb_id.get(movie.tmdb_id):
                movies_by_tmdb_id[movie.tmdb_id] = []
            movies_by_tmdb_id[movie.tmdb_id].append(movie)

        json_movies = []
        for tmdb_id, movies in movies_by_tmdb_id.items():
            json_movie = {
                'tmdbId': tmdb_id,
                'mediaType': movies[0].media_type,
                'title': movies[0].title,
                'description': movies[0].description,
                'coverUrl': movies[0].cover_url,
                'episodes': [],
                'isStarred': tmdb_id in starred_movies,
            }

            for movie in movies:
                watch_status = watch_statuses.get(movie.pk)
                json_movie['episodes'].append({
                    'conversionStatus': movie.conversion_status,
                    'convertedVideoUrl': movie.converted_url,
                    'dateAdded': movie.date_added,
                    'id': movie.id,
                    'lastWatched': watch_status.last_watched if watch_status else None,
                    'originalVideoUrl': movie.original_url,
                    'season': movie.season,
                    'episode': movie.episode,
                    'progress': watch_status.stopped_at if watch_status else 0,
                    'releaseYear': movie.release_year,
                    'srtSubtitlesUrlEn': movie.srt_subtitles_url_en,
                    'srtSubtitlesUrlDe': movie.srt_subtitles_url_de,
                    'srtSubtitlesUrlFr': movie.srt_subtitles_url_fr,
                    'vttSubtitlesUrlEn': movie.vtt_subtitles_url_en,
                    'vttSubtitlesUrlDe': movie.vtt_subtitles_url_de,
                    'vttSubtitlesUrlFr': movie.vtt_subtitles_url_fr,
                    'originalVideoPreserved': not movie.original_is_same_as_converted,
                })

            json_movies.append(json_movie)

        return JsonResponse({'movies': json_movies})

    def post(self, request, *args, **kwargs):
        """
        Create or update a movie/show with a list of episodes.
        """
        if not request.user.has_perm('authentication.movies_manage'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

        payload = json.loads(request.body)

        with transaction.atomic():
            # Create the episodes
            episodes: List[Episode] = []
            for json_episode in payload.get('episodes', []):
                episode = Episode.objects.get_or_create(
                    tmdb_id=payload.get('tmdbId'),
                    episode=json_episode.get('episode', None),
                    season=json_episode.get('season', None),
                    media_type=payload.get('mediaType', Episode.MOVIE)
                )[0]

                if payload.get('title'):
                    episode.title = payload.get('title')
                if payload.get('description'):
                    episode.description = payload.get('description')
                if 'dateAdded' in json_episode:
                    episode.date_added = json_episode.get('dateAdded')

                if 'progress' in json_episode or 'lastWatched' in json_episode:
                    watch_status = EpisodeWatchStatus.objects.get_or_create(user=request.user, episode=episode)[0]
                    if 'progress' in json_episode:
                        watch_status.stopped_at = json_episode.get('progress', 0)
                    if 'lastWatched' in json_episode:
                        watch_status.last_watched = json_episode.get('lastWatched')
                    watch_status.save()
                if json_episode.get('releaseYear'):
                    episode.release_year = json_episode.get('releaseYear')

                episodes.append(episode)
                episode.save()

            # Retrieve the (optional) triage options
            triage_options = [
                json_episode.get('triage', {
                    'movieFile': None,
                    'subtitlesFileEn': None,
                    'subtitlesFileFr': None,
                    'subtitlesFileDe': None,
                })
                for json_episode in payload.get('episodes', [])
            ]

            # Create hard links to the files in the triage directory so that they can be
            # in the triage directory and in the movie library at the same time.
            # If the movie is already in the library, overwrite the file.
            conversion_queue = []
            for episode, triage_options in zip(episodes, triage_options):
                episode_triage_path = settings.TRIAGE_PATH / Path(triage_options.get('movieFile'))

                # Create hard link to the original video in the movie library
                if episode_triage_path.exists():
                    episode.triage_path = episode_triage_path

                    logger.info(f'Copying video "{str(episode_triage_path)}" to "{str(episode.original_path)}"')
                    episode.original_path.unlink(missing_ok=True)
                    episode.original_path.hardlink_to(episode_triage_path)
                    episode.save()

                # Create hard link to subtitle files in the movie library
                for language in ('En', 'De', 'Fr'):
                    if not triage_options.get(f'subtitlesFile{language}'):
                        continue

                    subtitles_triage_path = settings.TRIAGE_PATH / triage_options[f'subtitlesFile{language}']
                    assert subtitles_triage_path.exists()

                    subtitles_original_path: Path = getattr(episode, f'srt_subtitles_path_{language.lower()}')
                    logger.info(f'Copying subtitles "{str(subtitles_triage_path)}" to "{str(subtitles_original_path)}"')
                    subtitles_original_path.unlink(missing_ok=True)
                    subtitles_original_path.hardlink_to(subtitles_triage_path)

                conversion_queue.append(episode)

            # Download the cover URL if necessary
            new_cover_url = payload.get('coverUrl')
            if new_cover_url and new_cover_url != episodes[0].cover_url:
                self.download_file(new_cover_url, episodes[0].cover_path)

        return JsonResponse({'result': 'success'})

    def download_file(self, url: str, filename: Path):
        req = requests.get(url, stream=True)
        if req.status_code == 200:
            with filename.open('wb') as cover_file:
                for chunk in req:
                    cover_file.write(chunk)
        else:
            logger.error(f"Could not download file at {url}.")


class DeleteOriginalView(PermissionRequiredMixin, View):
    permission_required = 'authentication.movies_manage'
    raise_exception = True

    def delete(self, request, *args, **kwargs):
        """
        Delete an original video, and replace it with the converted version. For example, delete the 4K version and keep
        only the smaller web version.
        """
        episode_id = kwargs.get('id')
        try:
            episode = Episode.objects.get(pk=episode_id)
            episode.original_path.unlink(missing_ok=True)
            episode.original_path.with_suffix('.mp4').unlink(missing_ok=True)
            episode.original_path.hardlink_to(episode.converted_path)
        except Episode.DoesNotExist:
            message = 'Episode does not exist.'
            logger.error(f"Failed to replace original of episode #{episode_id}. {message}")
            return JsonResponse({'result': 'failure', 'message': message}, status=404)
        except ConnectionError:
            logger.error(f"Failed to replace original of episode #{episode_id}. Could not connect to server.")
            return JsonResponse({'result': 'failure', 'message': 'Failed to replace original of episode.'}, status=500)
        return JsonResponse({'result': 'success'})


class EpisodeView(PermissionRequiredMixin, View):
    permission_required = 'authentication.movies_manage'
    raise_exception = True

    def delete(self, request, *args, **kwargs):
        if not request.user.has_perm('authentication.movies_manage'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

        episode_id = kwargs.get('id')
        try:
            Episode.objects.get(pk=episode_id).delete()
            logger.info(f'Deleted episode #{episode_id}.')
        except Episode.DoesNotExist:
            logger.warning(f'Could not delete episode #{episode_id}. Episode does not exist.')
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        return JsonResponse({'result': 'success'})


class TriageListView(PermissionRequiredMixin, View):
    """
    List of untriaged video and subtitle files
    """
    permission_required = 'authentication.movies_manage'
    raise_exception = True

    def get(self, request, *args, **kwargs):
        video_files = []
        subtitle_files = []

        # TODO: convert to pathlib
        for root, dirs, files in os.walk(settings.TRIAGE_PATH):
            for filename in files:
                absolute_path = os.path.join(root, filename)
                if filename.lower().endswith(settings.VIDEO_EXTENSIONS):
                    video_files.append(absolute_path)
                if filename.lower().endswith(settings.SUBTITLE_EXTENSIONS):
                    subtitle_files.append(absolute_path)

        # These movies are still in the completed downloads, but they are already triaged. They're seeding.
        triaged_movie_files = Episode.objects.filter(triage_path__in=video_files).values_list('triage_path', flat=True)
        untriaged_video_files = set(video_files).difference(set(triaged_movie_files))

        relative_video_files = [os.path.relpath(abs_path, settings.TRIAGE_PATH) for abs_path in untriaged_video_files]
        relative_subtitle_files = [os.path.relpath(abs_path, settings.TRIAGE_PATH) for abs_path in subtitle_files]

        return JsonResponse({'movies': list(relative_video_files), 'subtitles': relative_subtitle_files})


class EpisodeWatchedView(PermissionRequiredMixin, View):
    permission_required = 'authentication.movies_watch'
    raise_exception = True

    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get('id')
        try:
            episode = Episode.objects.get(pk=episode_id)
            watch_status = EpisodeWatchStatus.objects.get_or_create(user=request.user, episode=episode)[0]
            watch_status.last_watched = datetime.date.today()
            watch_status.save()
        except Episode.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        return JsonResponse({'result': 'success'})


class EpisodeUnwatchedView(PermissionRequiredMixin, View):
    permission_required = 'authentication.movies_watch'
    raise_exception = True

    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get('id')
        try:
            episode = Episode.objects.get(pk=episode_id)
            watch_status = EpisodeWatchStatus.objects.get(user=request.user, episode=episode)
            watch_status.delete()
        except EpisodeWatchStatus.DoesNotExist:
            pass
        except Episode.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        return JsonResponse({'result': 'success'})


class EpisodeStarView(PermissionRequiredMixin, View):
    permission_required = 'authentication.movies_watch'
    raise_exception = True

    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get('id')
        try:
            episode = Episode.objects.get(pk=episode_id)
            star = StarredMovie.objects.get_or_create(user=request.user, tmdb_id=episode.tmdb_id)[0]
            star.save()
        except Episode.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        return JsonResponse({'result': 'success'})


class EpisodeUnstarView(PermissionRequiredMixin, View):
    permission_required = 'authentication.movies_watch'
    raise_exception = True

    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get('id')
        try:
            episode = Episode.objects.get(pk=episode_id)
            StarredMovie.objects.get(user=request.user, tmdb_id=episode.tmdb_id).delete()
        except StarredMovie.DoesNotExist:
            pass
        except Episode.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        return JsonResponse({'result': 'success'})


class EpisodeProgressView(PermissionRequiredMixin, View):
    permission_required = 'authentication.movies_watch'
    raise_exception = True

    def post(self, request, *args, **kwargs):
        episode_id = kwargs.get('id')
        payload = json.loads(request.body)
        try:
            episode = Episode.objects.get(pk=episode_id)
            watch_status = EpisodeWatchStatus.objects.get_or_create(user=request.user, episode=episode)[0]
            watch_status.stopped_at = int(payload['progress'])
            watch_status.save()
        except Episode.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        except KeyError:
            return JsonResponse(
                {'result': 'failure', 'message': '`progress` is missing from request payload'}, status=400)
        except ValueError:
            return JsonResponse(
                {'result': 'failure', 'message': '`progress` must be an integer'}, status=400)
        return JsonResponse({'result': 'success'})
