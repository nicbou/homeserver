class MoviesService {
  static getMovies() {
    return Api.request.get('/movies')
      .then((response) => {
        return response.data.movies.map(movie => Movie.fromMovieApiResponse(movie));
      });
  }

  static markAsWatched(id) {
    Api.request.post(`/movies/${id}/watched/`);
  }

  static markAsUnwatched(id) {
    Api.request.post(`/movies/${id}/unwatched/`);
  }

  static save(movie, params={}) {
    const triageParams = {
      movieFile: params.movieFile || null,
      subtitlesFile: params.subtitlesFile || null,
      convertToMp4: params.convertToMp4 || false,
    };

    const jsonEpisodes = movie.episodes.map((episode) => {
      return {
        lastWatched: episode.lastWatched,
        season: episode.season,
        episode: episode.episode,
        progress: episode.progress,
        releaseYear: episode.releaseYear,
        triage: triageParams,
      }
    })

    // Create/update the movie, then its episodes
    return Api.request.post('/movies/', {
      tmdbId: movie.tmdbId,
      title: movie.title,
      mediaType: movie.mediaType,
      description: movie.description,
      coverUrl: movie.coverUrl,
      rating: movie.rating,
      episodes: jsonEpisodes
    });
  }

  static delete(id) {
    Api.request.delete(`/movies/${id}/`);
  }
}