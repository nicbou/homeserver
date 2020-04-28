class MoviesService {
  static getMovies() {
    return Api.request.get('/movies/')
      .then((response) => {
        return response.data.movies.map(movie => Movie.fromMovieApiResponse(movie));
      });
  }

  static markAsWatched(id) {
    return Api.request.post(`/movies/${id}/watched/`);
  }

  static markAsUnwatched(id) {
    return Api.request.post(`/movies/${id}/unwatched/`);
  }

  static setProgress(id, progressInSeconds) {
    return Api.request.post(`/movies/${id}/progress/`, {'progress': progressInSeconds});
  }

  static save(movie, params={}) {
    const triageParams = {
      movieFile: params.movieFile || null,
      subtitlesFileEn: params.subtitlesFileEn || null,
      subtitlesFileDe: params.subtitlesFileDe || null,
      subtitlesFileFr: params.subtitlesFileFr || null,
      convertToMp4: params.convertToMp4 || false,
    };

    const jsonEpisodes = movie.episodeList.map((episode) => {
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
    return Api.request.delete(`/movies/${id}/`);
  }

  static subtitlesExist(episode){
    const requestConfig = {
      validateStatus: function (status) {
        return (status >= 200 && status < 300) || status === 404;
      },
    }

    return Promise.all([
      Api.fileRequest.head(episode.srtSubtitlesUrlEn, requestConfig),
      Api.fileRequest.head(episode.srtSubtitlesUrlFr, requestConfig),
      Api.fileRequest.head(episode.srtSubtitlesUrlDe, requestConfig)
    ]).then(results => {
      return {
        'en': results[0].status !== 404,
        'fr': results[1].status !== 404,
        'de': results[2].status !== 404,
      }
    });
  }
}