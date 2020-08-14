import { Movie } from './../models/movies.js';

export default class {
  static getMovies() {
    return fetch('/api/movies/').then((response) => {
      return response.json().then(data => data.movies.map(movie => Movie.fromMovieApiResponse(movie)));
    });
  }

  static markAsWatched(id) {
    return fetch(
      `/api/movies/${id}/watched/`,
      {method: 'POST'}
    ).then((response) => {
      return response.json();
    });
  }

  static markAsUnwatched(id) {
    return fetch(
      `/api/movies/${id}/unwatched/`,
      {method: 'POST'}
    ).then((response) => {
      return response.json();
    });
  }

  static setProgress(id, progressInSeconds) {
    return fetch(
      `/api/movies/${id}/progress/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress: progressInSeconds
        }),
      }
    ).then(response => response.json());
  }

  static starEpisode(id) {
    return fetch(
      `/api/movies/${id}/star/`,
      {method: 'POST'}
    ).then((response) => {
      return response.json();
    });
  }

  static unstarEpisode(id) {
    return fetch(
      `/api/movies/${id}/unstar/`,
      {method: 'POST'}
    ).then((response) => {
      return response.json();
    });
  }

  static save(movie, params={}) {
    const jsonEpisodes = movie.episodeList.map((episode) => {
      return {
        lastWatched: episode.lastWatched,
        season: episode.season,
        episode: episode.episode,
        progress: episode.progress,
        releaseYear: episode.releaseYear,
        triage: {
          movieFile: params.movieFile || null,
          subtitlesFileEn: params.subtitlesFileEn || null,
          subtitlesFileDe: params.subtitlesFileDe || null,
          subtitlesFileFr: params.subtitlesFileFr || null,
          convertToMp4: params.convertToMp4 || false,
        },
      }
    })

    return fetch(
      '/api/movies/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          title: movie.title,
          mediaType: movie.mediaType,
          description: movie.description,
          coverUrl: movie.coverUrl,
          rating: movie.rating,
          episodes: jsonEpisodes
        }),
      }
    ).then((response) => {
      return response.json();
    });
  }

  static delete(id) {
    return fetch(
      `/api/movies/${id}/`,
      {method: 'DELETE'}
    ).then((response) => {
      return response.json();
    });
  }

  static convert(id) {
    return fetch(
      `/api/movies/${id}/convert/`,
      {method: 'POST'}
    ).then((response) => {
      return response.json();
    });
  }

  static subtitlesExist(episode){
    function fileExists(url) {
      return fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
      })
      .then((response) => {
        return (response.status >= 200 && response.status < 300);
      })
      .catch(err => false)
    };

    return Promise.all([
      fileExists(episode.srtSubtitlesUrlEn),
      fileExists(episode.srtSubtitlesUrlFr),
      fileExists(episode.srtSubtitlesUrlDe)
    ]).then(results => {
      return {
        'en': results[0],
        'fr': results[1],
        'de': results[2],
      }
    });
  }
}