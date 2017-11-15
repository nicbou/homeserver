# -*- coding: utf-8 -*-
from django.http import JsonResponse
from .models import Movie, MovieAccessToken
from django.views import View
from django.conf import settings
from django.db import transaction
from django.utils.crypto import salted_hmac
import json
import logging
import os
import requests

logger = logging.getLogger(__name__)


def movie_conversion_callback_token(movie):
    return salted_hmac(movie.tmdb_id, movie.id).hexdigest()


class JSONMovieListView(View):
    def get(self, request, *args, **kwargs):
        movies_by_tmdb_id = {}

        for movie in Movie.objects.all():
            if not movies_by_tmdb_id.get(movie.tmdb_id):
                movies_by_tmdb_id[movie.tmdb_id] = []
            movies_by_tmdb_id[movie.tmdb_id].append(movie)

        json_movies = []
        for tmdb_id, movies in movies_by_tmdb_id.iteritems():
            json_movie = {
                'tmdbId': tmdb_id,
                'mediaType': movies[0].media_type,
                'title': movies[0].title,
                'description': movies[0].description,
                'coverUrl': movies[0].cover_url,
                'rating': movie.rating,
                'episodes': []
            }

            for movie in movies:
                json_movie['episodes'].append({
                    'conversionStatus': movie.conversion_status,
                    'convertedVideoUrl': movie.converted_url,
                    'dateAdded': movie.date_added,
                    'id': movie.id,
                    'lastWatched': movie.last_watched,
                    'originalVideoUrl': movie.library_url,
                    'season': movie.season,
                    'episode': movie.episode,
                    'progress': movie.stopped_at,
                    'releaseYear': movie.release_year,
                    'srtSubtitlesUrl': movie.srt_subtitles_url,
                    'vttSubtitlesUrl': movie.vtt_subtitles_url,
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
            episodes = []
            for json_episode in payload.get('episodes', []):
                episode = Movie.objects.get_or_create(
                    tmdb_id=payload.get('tmdbId'),
                    episode=json_episode.get('episode', None),
                    season=json_episode.get('season', None),
                    media_type=json_episode.get('mediaType', Movie.MOVIE)
                )[0]

                if payload.get('title'):
                    episode.title = payload.get('title')
                if payload.get('description'):
                    episode.description = payload.get('description')
                if json_episode.get('dateAdded'):
                    episode.date_added = json_episode.get('dateAdded')
                if json_episode.get('lastWatched'):
                    episode.last_watched = json_episode.get('lastWatched')
                if json_episode.get('progress', 0):
                    episode.stopped_at = json_episode.get('progress', 0)
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
            conversion_queue = []
            for episode, triage_options in zip(episodes, triage_options):
                movie_file = triage_options.get('movieFile')
                movie_file_abs = os.path.join(settings.TRIAGE_PATH, movie_file) if movie_file else None
                if movie_file and os.path.exists(movie_file_abs):
                    episode.triage_path = movie_file
                    episode.original_extension = os.path.splitext(movie_file)[1][1:].lower()  # extension without dot
                    try:
                        os.unlink(episode.library_path.encode('utf-8'))
                    except:
                        pass
                    os.link(movie_file_abs.encode('utf-8'), episode.library_path.encode('utf-8'))
                    episode.save()

                subtitles_file = triage_options.get('subtitlesFile')
                subtitles_file_abs = os.path.join(settings.TRIAGE_PATH, subtitles_file) if subtitles_file else None
                if subtitles_file and os.path.exists(subtitles_file_abs):
                    try:
                        os.unlink(episode.srt_subtitles_path.encode('utf-8'))
                    except:
                        pass
                    os.link(subtitles_file_abs.encode('utf-8'), episode.srt_subtitles_path.encode('utf-8'))

                if bool(triage_options.get('convertToMp4')):
                    conversion_queue.append(episode)

            # Download the cover URL if necessary
            new_cover_url = payload.get('coverUrl')
            if new_cover_url and new_cover_url != episodes[0].cover_url:
                self.download_image(new_cover_url, episodes[0].cover_path)

            # Queue movies for conversion
            for episode in conversion_queue:
                episode.conversion_status = Movie.CONVERTING
                episode.save()

                api_url = "{host}/videoToMp4".format(host=settings.VIDEO_PROCESSING_API_URL)
                callback_url = "http://{host}/movies/videoToMp4/callback/?id={id}&token={token}".format(
                    host=request.get_host(),  # Note: this might fail behind multiple proxies. See Django docs.
                    id=episode.id,
                    token=movie_conversion_callback_token(episode)
                )
                requests.post(api_url, json={'input': episode.library_filename, 'callbackUrl': callback_url})

        return JsonResponse({'result': 'success'})

    def download_image(self, url, filename):
        req = requests.get(url, stream=True)
        if req.status_code == 200:
            with open(filename.encode('utf-8'), 'wb') as cover_file:
                for chunk in req:
                    cover_file.write(chunk)


class JSONMovieView(View):
    def delete(self, request, *args, **kwargs):
        if not request.user.has_perm('authentication.movies_manage'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

        movie_id = kwargs.get('id')
        try:
            Movie.objects.get(pk=movie_id).delete()
        except Movie.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Movie does not exist'}, 404)
        return JsonResponse({'result': 'success'})


class JSONMovieTriageListView(View):
    """Return a list of untriaged movie and subtitle files."""

    def get(self, request, *args, **kwargs):
        if not request.user.has_perm('authentication.movies_manage'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

        movie_extensions = (
            '.mkv', '.avi', '.mpg', '.wmv', '.mov', '.m4v', '.3gp', '.mpeg', '.mpe', '.ogm', '.flv', '.divx', '.mp4'
        )
        subtitle_extensions = ('.srt', '.vtt')

        movie_files = []
        subtitle_files = []
        for root, dirs, files in os.walk(settings.TRIAGE_PATH):
            for filename in files:
                relative_path = os.path.relpath(os.path.join(root, filename), settings.TRIAGE_PATH)
                if filename.lower().endswith(movie_extensions):
                    movie_files.append(relative_path)
                if filename.lower().endswith(subtitle_extensions):
                    subtitle_files.append(relative_path)

        # These movies are still in the completed downloads, but they are already triaged. They're seeding.
        triaged_movie_files = Movie.objects.filter(triage_path__in=movie_files).values_list('triage_path', flat=True)
        untriaged_movie_files = set(movie_files).difference(set(triaged_movie_files))

        return JsonResponse({'movies': list(untriaged_movie_files), 'subtitles': subtitle_files})


class JSONMovieConversionCallbackView(View):
    """Called when a movie conversion task is finished."""

    def post(self, request, *args, **kwargs):
        payload = json.loads(request.body, encoding='UTF-8')

        if 'id' not in request.GET:
            return JsonResponse({'result': 'failure', 'message': '`id` is missing from query string'}, status=400)
        if 'status' not in payload:
            return JsonResponse(
                {'result': 'failure', 'message': '`status` is missing from request payload'}, status=400)
        if 'token' not in request.GET:
            return JsonResponse(
                {'result': 'failure', 'message': '`token` parameter is missing from query string'}, status=400)

        try:
            movie = Movie.objects.get(pk=request.GET['id'])
        except Movie.DoesNotExist:
            return JsonResponse({'result': 'failure', 'message': 'Movie does not exist'}, status=204)

        conversion_status = payload['status']

        if request.GET['token'] == movie_conversion_callback_token(movie):
            try:
                movie.conversion_status = Movie.status_map[conversion_status]
                movie.save()
            except KeyError:
                return JsonResponse(
                    {'result': 'failure', 'message': '`{}` is not a valid `status` value'.format(conversion_status)},
                    status=400
                )

            # Queue the subtitles for conversion
            if os.path.exists(movie.srt_subtitles_path):
                api_url = "{host}/subtitlesToVTT".format(host=settings.VIDEO_PROCESSING_API_URL)
                requests.post(api_url, json={'input': movie.srt_subtitles_filename})

            return JsonResponse({'result': 'success'})
        else:
            return JsonResponse({'result': 'failure', 'message': 'Invalid `token`'}, status=400)


class JSONMovieAccessTokenView(View):
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            movie_id = kwargs.get('id')
            try:
                movie = Movie.objects.get(pk=movie_id)
            except Movie.DoesNotExist:
                return JsonResponse({'result': 'failure', 'message': 'Movie does not exist'}, 404)
            access_token = MovieAccessToken(movie=movie, user=request.user)
            access_token.save()
            return JsonResponse({'token': access_token.token, 'expirationDate': access_token.expiration_date})
        else:
            return JsonResponse({'result': 'failure', 'message': 'Not authenticated'}, status=401)
