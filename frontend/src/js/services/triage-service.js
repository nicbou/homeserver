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
            return Movie.fromTMDBSearchResult(result);
          })
        }
      );
    })
  }
}