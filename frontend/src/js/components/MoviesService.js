class MoviesService extends JsonService {
  getMovies() {
    return new Promise((resolve, reject) => {
      this.getJson(`${API_URL}/movies`).then(
        (responseJson) => {
          const movies = responseJson.movies.map(movie => new Movie(movie));
          resolve(movies);
        },
        (responseJson) => {
          reject(responseJson)
        }
      );
    });
  }

  markAsWatched(id) {
    return new Promise((resolve, reject) => {
      this.post(`${API_URL}/movies/${id}/watched/`).then(
        (responseJson) => { resolve(); },
        (responseJson) => { reject(); }
      );
    });
  }

  markAsUnwatched(id) {
    return new Promise((resolve, reject) => {
      this.post(`${API_URL}/movies/${id}/unwatched/`).then(
        (responseJson) => { resolve(); },
        (responseJson) => { reject(); }
      );
    });
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      this.post(`${API_URL}/player/delete/${id}/`).then(
        (responseJson) => { resolve(); },
        (responseJson) => { reject(); }
      );
    });
  }
}