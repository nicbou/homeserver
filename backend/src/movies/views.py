from utils.views import LoginRequiredMixin, JsonResponse
from django.core.serializers.json import DjangoJSONEncoder
from .models import Movie
from django.views import View
import json
import logging

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
                    'srtSubtitlesUrl': movie.srt_subtitles_url,
                    'vttSubtitlesUrl': movie.vtt_subtitles_url,
                })

            json_movies.append(json_movie)

        return JsonResponse(json.dumps({'movies': json_movies}, cls=DjangoJSONEncoder))
