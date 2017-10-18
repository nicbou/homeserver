from utils.views import LoginRequiredMixin, JsonResponse
from django.core.serializers.json import DjangoJSONEncoder
from .models import Movie
from django.views import View
from django.conf import settings
from django.http import HttpResponse
import json
import logging
import os
import urllib
try:
    from urllib.parse import quote
except:
    from urllib import quote
try:
    from urllib.request import urlopen
except:
    from urllib2 import urlopen

logger = logging.getLogger(__name__)


class JSONMovieListView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        movies_by_imdb_id = {}

        for movie in Movie.objects.all():
            if not movies_by_imdb_id.get(movie.imdb_id):
                movies_by_imdb_id[movie.imdb_id] = []
            movies_by_imdb_id[movie.imdb_id].append(movie)

        json_movies = []
        for imdb_id, movies in movies_by_imdb_id.iteritems():
            json_movie = {
                'imdbId': imdb_id,
                'title': movies[0].title,
                'description': movies[0].description,
                'coverUrl': "/media/posters/{}.jpg".format(movies[0].id),
                'rating': movie.rating,
                'parts': []
            }

            for movie in movies:
                json_movie['parts'].append({
                    'conversionStatus': movie.status,
                    'convertedVideoUrl': movie.converted_url,
                    'dateAdded': movie.date_added,
                    'id': movie.id,
                    'lastWatched': movie.last_watched,
                    'originalVideoUrl': movie.original_url,
                    'partNumber': movie.part,
                    'progress': movie.stopped_at,
                    'releaseYear': movie.release_year,
                    'srtSubtitlesUrl': movie.srt_subtitles_url,
                    'vttSubtitlesUrl': movie.vtt_subtitles_url,
                })

            json_movies.append(json_movie)

        return JsonResponse(json.dumps({'movies': json_movies}, cls=DjangoJSONEncoder))


class JSONMovieTriageListView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        movie_extensions = (
            '.mkv', '.avi', '.mpg', '.wmv', '.mov', '.m4v', '.3gp', '.mpeg', '.mpe', '.ogm', '.flv', '.divx', '.mp4'
        )
        subtitle_extensions = ('.srt', '.vtt')

        movie_files = []
        subtitle_files = []
        for root, dirs, files in os.walk(settings.TRIAGE_PATH):
            for filename in files:
                if filename.lower().endswith(movie_extensions):
                    movie_files.append(filename)
                if filename.lower().endswith(subtitle_extensions):
                    movie_files.append(filename)

        return JsonResponse(json.dumps({'movies': movie_files, 'subtitles': subtitle_files}, cls=DjangoJSONEncoder))


class JSONMovieTriageView(LoginRequiredMixin, View):
    """Adds a movie to the library."""

    def post(self, request, *args, **kwargs):
        payload = json.loads(request.body.decode("utf-8"))

        if (
            'imdbId' not in payload or
            'title' not in payload or
            'moviePath' not in payload
        ):
            return HttpResponse(status=400)

        # Create the database record
        movie = Movie(
            title=payload.get('title'),
            part=payload.get('partNumber'),
            imdb_id=payload.get('imdbId'),
        )

        # Move file to the movie library
        # TODO: Support multiple subtitle URLs
        os.link(payload.get('moviePath'), movie.original_path)

        subtitles_path = payload.get('subtitlePaths', [])[0]
        if subtitles_path:
            os.link(subtitles_path, movie.srt_subtitles_path)

        # Get missing movie information, download cover
        cover_url = None
        if movie.title and movie.imdb_id:
            api_url = "http://www.omdbapi.com/?r=json&i=%s" % quote(self.imdb_id)
            api_data = json.loads(urlopen(api_url.encode("utf-8")).read().decode("utf-8"))

            if api_data.get('Response') == 'True':
                if not api_data['imdbRating'] == 'N/A':
                    movie.rating = api_data['imdbRating']
                movie.description = api_data['Plot']
                movie.release_year = api_data['Year']

                cover_url = api_data['Poster']
                if cover_url and not cover_url == 'N/A':
                    urllib.urlretrieve(cover_url, movie.cover_path)

        movie.save()

        # Begin the conversion process
        if payload.get('convert'):
            # TODO: convert the movie
            pass
