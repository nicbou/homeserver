import { Movie } from './../models/movies.js';

export default class {
  constructor(omdbApiKey = '') {
    this.omdbApiKey = omdbApiKey;
  }

  static getFilesToTriage() {
    return fetch('/api/movies/triage/').then((response) => {
      return response.json();
    });
  }

  static getSuggestions(query) {
    query = query.trim();
    if (query.length === 0) {
      return Promise.resolve([]);
    }

    const searchUrl = new URL('https://api.themoviedb.org/3/search/multi');
    searchUrl.search = new URLSearchParams({
      api_key: '9606c6bb1f60afb5a30ef4e830d95936', 
      query: query,
      language: 'en-US',
    })

    return fetch(searchUrl).then((response) => {
      return response.json().then(response => {
        return response.results
          .filter(movie => ['movie', 'tv'].includes(movie.media_type))
          .map((result) => {
            const coverRelativeUrl = result.poster_path || result.cover_path;
            const releaseDate = result.release_date || result.first_air_date;

            const episode = new Episode();
            episode.id = null;
            episode.season = null;
            episode.episode = null;
            episode.conversionStatus = ConversionStatus.NOT_CONVERTED;
            episode.lastWatched = null;
            episode.convertedVideoUrl = null;
            episode.originalVideoUrl = null;
            episode.vttSubtitlesUrlEn = null;
            episode.vttSubtitlesUrlDe = null;
            episode.vttSubtitlesUrlFr = null;
            episode.srtSubtitlesUrlEn = null;
            episode.srtSubtitlesUrlDe = null;
            episode.srtSubtitlesUrlFr = null;
            episode.releaseYear = releaseDate ? parseInt(releaseDate.substring(0,4)) : null;
            episode.progress = 0;
            episode.duration = null;
            episode.dateAdded = moment();

            const movie = new Movie();
            movie.tmdbId = result.id;
            movie.title = result.title || result.name;
            movie.description = result.overview;
            movie.coverUrl = coverRelativeUrl ? `https://image.tmdb.org/t/p/w500${coverRelativeUrl}` : null;
            movie.mediaType = result.media_type == 'tv' ? MediaType.TV_SHOW : MediaType.MOVIE;
            movie.episodeMap = {[episode.id]: episode};
            return movie;
          })
        }
      );
    })
  }
}