import { Movie, Episode } from './../models/movies.js';

export default class {
  static async getMovies() {
    const response = await fetch('/api/movies/');
    const responseJson = await response.json();
    return responseJson.movies.map(jsonMovie => {
      const movie = new Movie();
      movie.isStarred = !!jsonMovie.isStarred;
      movie.tmdbId = jsonMovie.tmdbId;
      movie.title = jsonMovie.title;
      movie.description = jsonMovie.description;
      movie.coverUrl = jsonMovie.coverUrl;
      movie.mediaType = jsonMovie.mediaType;
      movie.episodeMap = jsonMovie.episodes.reduce(
        (episodes, jsonEpisode) => {
          const episode = new Episode();
          episode.id = jsonEpisode.id;
          episode.season = jsonEpisode.season;
          episode.episode = jsonEpisode.episode;
          episode.conversionStatus = jsonEpisode.conversionStatus;
          episode.lastWatched = jsonEpisode.lastWatched ? moment(jsonEpisode.lastWatched) : null;
          episode.largeVideoUrl = jsonEpisode.largeVideoUrl;
          episode.releaseYear = jsonEpisode.releaseYear;
          episode.progress = jsonEpisode.progress;
          episode.duration = jsonEpisode.duration;
          episode.dateAdded = moment(jsonEpisode.dateAdded);
          episode.hasLargeVersion = jsonEpisode.hasLargeVersion;
          episodes[episode.id] = episode;
          return episodes;
        },
        {}
      );
      return movie;
    });
  }

  static markAsWatched(id) {
    return fetch(`/api/episodes/${id}/watched/`, {method: 'POST'}).then(r => r.json());
  }

  static markAsUnwatched(id) {
    return fetch(`/api/episodes/${id}/unwatched/`, {method: 'POST'}).then(r => r.json());
  }

  static setProgress(id, progressInSeconds) {
    return fetch(
      `/api/episodes/${id}/progress/`,
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
    const jsonEpisodes = movie.episodeList.map(episode => ({
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
      },
    }));

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
          episodes: jsonEpisodes
        }),
      }
    ).then(r => r.json());
  }

  static delete(id) {
    return fetch(`/api/episodes/${id}/`, {method: 'DELETE'}).then(r => r.json());
  }

  static deleteLargeVideo(id) {
    return fetch(`/api/episodes/${id}/large/`, {method: 'DELETE'}).then(r => r.json());
  }

  static async subtitlesExist(episode){
    function fileExists(url) {
      return fetch(url, {method: 'HEAD', cache: 'no-cache'}).then(r => r.ok).catch(err => false)
    };

    const [enSubsExist, frSubsExist, deSubsExist] = await Promise.all([
      fileExists(episode.subtitlesUrl('srt', 'eng')),
      fileExists(episode.subtitlesUrl('srt', 'fre')),
      fileExists(episode.subtitlesUrl('srt', 'ger'))
    ]);

    return {
      en: enSubsExist,
      fr: frSubsExist,
      de: deSubsExist,
    }
  }
}