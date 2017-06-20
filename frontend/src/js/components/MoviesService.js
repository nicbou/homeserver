class MoviesService {
  static getMovies() {
    return Api.request.get('/movies')
      .then((response) => {
        return response.data.movies.map(movie => new Movie(movie));
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