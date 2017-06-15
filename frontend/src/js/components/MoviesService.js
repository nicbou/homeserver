class MoviesService {
  static getMovies() {
    return Api.request.get('/movies')
      .then((response) => {
        const movies = response.data.movies.map(movie => new Movie(movie));
        resolve(movies);
      });
  }

  static markAsWatched(id) {
    Api.request.post(`/movies/${id}/watched/`);
  }

  static markAsUnwatched(id) {
    Api.request.post(`/movies/${id}/unwatched/`);
  }

  static delete(id) {
    Api.request.post(`/player/delete/${id}/`);
  }
}