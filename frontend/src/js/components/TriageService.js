class TriageService {
  constructor(omdbApiKey = '') {
    this.omdbApiKey = omdbApiKey;
  }

  static getFilesToTriage() {
    return Api.request.get('/movies/triage')
      .then((response) => {
        return response.data
      });
  }

  static getSuggestions(query) {
    query = query.trim();
    if (query.length === 0) {
      return Promise.resolve([]);
    }

    return axios.get('https://api.themoviedb.org/3/search/multi', {
      params: {
        search_type: 'ngram',
        api_key: '9606c6bb1f60afb5a30ef4e830d95936', 
        query: query,
        language: 'en',
      }
    }).then((response) => {
      return response.data.results
        .filter(movie => ['movie', 'tv'].includes(movie.media_type))
        .map((result) => {
          return Movie.fromTMDBSearchResult(result);
        })
    })
  }
}