# -*- coding: utf-8 -*-
from pathlib import Path
from typing import List

from django.http import JsonResponse
from requests import HTTPError, Timeout

from .models import Episode, EpisodeWatchStatus, EpisodeAccessToken, StarredMovie
from django.views import View
from django.conf import settings
from django.db import transaction
import json
import logging
import os
import requests
import datetime


logger = logging.getLogger(__name__)


class JSONMovieListView(View):
    def get(self, request, *args, **kwargs):
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
                    'originalVideoUrl': movie.library_url,
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
                })

            json_movies.append(json_movie)

        return JsonResponse({'movies': json_movies})

    def post(self, request, *args, **kwargs):
        """Create or update a movie with a list of episodes."""
        if not request.user.has_perm('authentication.movies_manage'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

        payload = json.loads(request.body, encoding='UTF-8')

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
                    'subtitlesFile': None,
                    'convertToMp4': False
                })
                for json_episode in payload.get('episodes', [])
            ]

            # Link the movies and subtitles from the triage dir to the the library dir
            # If the movie is already in the library, overwrite the file
            # TODO: Make this section more readable
            conversion_queue = []
            for episode, triage_options in zip(episodes, triage_options):
                episode_original_file = Path(triage_options.get('movieFile'))
                episode_original_file_path = settings.TRIAGE_PATH / episode_original_file if episode_original_file else None

                # Hard link original video
                if episode_original_file and episode_original_file_path.exists():
                    episode.triage_path = episode_original_file
                    episode.original_extension = episode_original_file.suffix.lower()[1:]
                    episode.library_path.unlink(missing_ok=True)
                    episode_original_file_path.link_to(episode.library_path)
                    episode.save()

                # Hard link subtitles
                for subtitles_language in ('En', 'De', 'Fr'):
                    subtitles_file = Path(triage_options.get('subtitlesFile' + subtitles_language))
                    subtitles_file_abs = settings.TRIAGE_PATH / subtitles_file if subtitles_file else None
                    if subtitles_file and subtitles_file_abs.exists():
                        dest_subtitles_path: Path = getattr(episode, f'srt_subtitles_path_{subtitles_language.lower()}')
                        dest_subtitles_path.unlink(missing_ok=True)
                        subtitles_file_abs.link_to(dest_subtitles_path)

                if bool(triage_options.get('convertToMp4')):
                    conversion_queue.append(episode)

            # Download the cover URL if necessary
            new_cover_url = payload.get('coverUrl')
            if new_cover_url and new_cover_url != episodes[0].cover_url:
                self.download_file(new_cover_url, episodes[0].cover_path)

            # Queue episodes for conversion
            for episode in conversion_queue:
                try:
                    queue_episode_for_conversion(episode)
                except ConnectionError:
                    logger.error(f"Failed to convert {episode}. Could not queue the episode for conversion.")

        return JsonResponse({'result': 'success'})

    def download_file(self, url: str, filename: Path):
        req = requests.get(url, stream=True)
        if req.status_code == 200:
            with filename.open('wb') as cover_file:
                for chunk in req:
                    cover_file.write(chunk)
        else:
            logger.error(f"Could not download file at {url}.")


class JSONEpisodeConvertView(View):
    def post(self, request, *args, **kwargs):
        """
        Queue an episode for conversion
        """
        # TODO: Permission check
        if not request.user.is_authenticated:
            return JsonResponse({'result': 'failure', 'message': 'Not authenticated'}, status=401)

        episode_id = kwargs.get('id')
        try:
            queue_episode_for_conversion(Episode.objects.get(pk=episode_id))
        except Episode.DoesNotExist:
            message = 'Episode does not exist'
            logger.error(f"Failed to convert episode #{episode_id}. {message}")
            return JsonResponse({'result': 'failure', 'message': message}, status=404)
        except ConnectionError:
            message = 'Could not queue the episode for conversion.'
            logger.error(f"Failed to convert episode #{episode_id}. {message}")
            return JsonResponse({'result': 'failure', 'message': message}, status=500)
        return JsonResponse({'result': 'success'})


def queue_episode_for_conversion(episode: Episode):
    api_url = f"{settings.VIDEO_PROCESSING_API_URL}/videoToMp4"
    callback_url = f"http://{os.environ['HOSTNAME']}/movies/videoToMp4/callback/?id={episode.pk}"

    try:
        episode.conversion_status = Episode.CONVERTING
        requests.post(api_url, json={'input': str(episode.library_filename), 'callbackUrl': callback_url})
    except (HTTPError, Timeout):
        episode.conversion_status = Episode.CONVERSION_FAILED
        raise ConnectionError(f"Failed to queue {episode} for conversion. Could not connect to server.")
    episode.save()


def queue_subtitles_for_conversion(episode: Episode):
    """
    Queue episode subtitles for conversion
    """
    subtitles_paths_and_filenames = (
        (episode.srt_subtitles_path_en, episode.srt_subtitles_filename_en),
        (episode.srt_subtitles_path_de, episode.srt_subtitles_filename_de),
        (episode.srt_subtitles_path_fr, episode.srt_subtitles_filename_fr),
    )
    for srt_subtitles_path, srt_subtitles_filename in subtitles_paths_and_filenames:
        if srt_subtitles_path.exists():
            try:
                requests.post(
                    f"{settings.VIDEO_PROCESSING_API_URL}/subtitlesToVTT",
                    json={'input': srt_subtitles_filename}
                )
            except (HTTPError, Timeout):
                raise ConnectionError(f"Failed to queue {episode} for conversion. Could not connect to server.")


class JSONEpisodeView(View):
    def delete(self, request, *args, **kwargs):
        if not request.user.has_perm('authentication.movies_manage'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

        episode_id = kwargs.get('id')
        try:
            Episode.objects.get(pk=episode_id).delete()
            logger.info(f'Deleted episode #{episode_id}. Episode does not exist.')
        except Episode.DoesNotExist:
            logger.warning(f'Could not delete episode #{episode_id}. Episode does not exist.')
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        return JsonResponse({'result': 'success'})


class JSONTriageListView(View):
    """
    List of untriaged video and subtitle files
    """
    def get(self, request, *args, **kwargs):
        if not request.user.has_perm('authentication.movies_manage'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

        video_files = []
        subtitle_files = []

        # TODO: convert to pathlib
        for root, dirs, files in os.walk(settings.TRIAGE_PATH):
            for filename in files:
                relative_path = os.path.relpath(os.path.join(root, filename), settings.TRIAGE_PATH)
                if filename.lower().endswith(settings.MOVIE_EXTENSIONS):
                    video_files.append(relative_path)
                if filename.lower().endswith(settings.SUBTITLE_EXTENSIONS):
                    subtitle_files.append(relative_path)

        # These movies are still in the completed downloads, but they are already triaged. They're seeding.
        triaged_movie_files = Episode.objects.filter(triage_path__in=video_files).values_list('triage_path', flat=True)
        untriaged_video_files = set(video_files).difference(set(triaged_movie_files))

        return JsonResponse({'movies': list(untriaged_video_files), 'subtitles': subtitle_files})


class JSONEpisodeConversionCallbackView(View):
    """
    Called when an episode conversion task is finished.
    """
    def post(self, request, *args, **kwargs):
        payload = json.loads(request.body, encoding='UTF-8')

        if 'id' not in request.GET:
            return JsonResponse({'result': 'failure', 'message': '`id` is missing from query string'}, status=400)
        if 'status' not in payload:
            return JsonResponse(
                {'result': 'failure', 'message': '`status` is missing from request payload'}, status=400)

        try:
            episode = Episode.objects.get(pk=request.GET['id'])
        except Episode.DoesNotExist:
            logger.warning(f"Conversion callback was called for an episode that does not exist (#{request.GET['id']})")
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=204)

        conversion_status = payload['status']

        try:
            episode.conversion_status = Episode.status_map[conversion_status]
            episode.save()
            logger.info(f"{episode} has finished converting. Conversion status: {conversion_status}")
        except KeyError:
            logger.warning(f"Conversion callback was called with an invalid conversion status: {conversion_status}")
            return JsonResponse(
                {'result': 'failure', 'message': f'`{conversion_status}` is not a valid `status` value'},
                status=400
            )

        try:
            queue_subtitles_for_conversion(episode)
        except ConnectionError:
            pass

        return JsonResponse({'result': 'success'})


class JSONEpisodeAccessTokenView(View):
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'result': 'failure', 'message': 'Not authenticated'}, status=401)

        episode_id = kwargs.get('id')
        try:
            episode = Episode.objects.get(pk=episode_id)
        except Episode.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        access_token = EpisodeAccessToken(episode=episode, user=request.user)
        access_token.save()
        return JsonResponse({'token': access_token.token, 'expirationDate': access_token.expiration_date})


class JSONEpisodeWatchedView(View):
    def post(self, request, *args, **kwargs):
        # TODO: Check for movie permissions
        if not request.user.is_authenticated:
            return JsonResponse({'result': 'failure', 'message': 'Not authenticated'}, status=401)

        episode_id = kwargs.get('id')
        try:
            episode = Episode.objects.get(pk=episode_id)
            watch_status = EpisodeWatchStatus.objects.get_or_create(user=request.user, episode=episode)[0]
            watch_status.last_watched = datetime.date.today()
            watch_status.save()
        except Episode.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        return JsonResponse({'result': 'success'})


class JSONEpisodeUnwatchedView(View):
    def post(self, request, *args, **kwargs):
        # TODO: Check for movie permissions
        if not request.user.is_authenticated:
            return JsonResponse({'result': 'failure', 'message': 'Not authenticated'}, status=401)

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


class JSONEpisodeStarView(View):
    def post(self, request, *args, **kwargs):
        # TODO: Check for movie permissions
        if not request.user.is_authenticated:
            return JsonResponse({'result': 'failure', 'message': 'Not authenticated'}, status=401)

        episode_id = kwargs.get('id')
        try:
            episode = Episode.objects.get(pk=episode_id)
            star = StarredMovie.objects.get_or_create(user=request.user, tmdb_id=episode.tmdb_id)[0]
            star.save()
        except Episode.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        return JsonResponse({'result': 'success'})


class JSONEpisodeUnstarView(View):
    def post(self, request, *args, **kwargs):
        # TODO: Check for movie permissions
        if not request.user.is_authenticated:
            return JsonResponse({'result': 'failure', 'message': 'Not authenticated'}, status=401)

        episode_id = kwargs.get('id')
        try:
            episode = Episode.objects.get(pk=episode_id)
            star = StarredMovie.objects.get(user=request.user, tmdb_id=episode.tmdb_id)
            star.delete()
        except StarredMovie.DoesNotExist:
            pass
        except Episode.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Episode does not exist'}, status=404)
        return JsonResponse({'result': 'success'})


class JSONEpisodeProgressView(View):
    def post(self, request, *args, **kwargs):
        # TODO: Check for movie permissions
        if not request.user.is_authenticated:
            return JsonResponse({'result': 'failure', 'message': 'Not authenticated'}, status=401)

        episode_id = kwargs.get('id')
        payload = json.loads(request.body, encoding='UTF-8')
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
