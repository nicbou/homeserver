const MoviesComponent = Vue.component('movies', {
  data: function() {
    return {
      movies: [],
      page: 0,
      moviesPerPage: 20,
      onlyShowConvertedMovies: false,
      query: ''
    }
  },
  computed: {
    selectedEpisode: function() {
      if (this.$route.params.episodeId) {
        return this.movies
          .map(movie => movie.episodes)
          .reduce((allEpisodes, episodes) => allEpisodes.concat(episodes), [])
          .find(episode => episode.id == this.$route.params.episodeId);
      }
      return null;
    },
    selectedMovie: function() {
      if (this.selectedEpisode) {
        return this.movies.find(movie => movie.episodes.includes(this.selectedEpisode));
      }
      return null;
    },
    trimmedQuery: function() {
      return this.query.trim().toLocaleLowerCase();
    },
    filteredMovies: function() {
      if (this.trimmedQuery) {
        return this.movies
          .filter((movie) => {
            return (
              this.trimmedQuery === ''
              || movie.title.toLocaleLowerCase().includes(this.trimmedQuery)
              || movie.description.toLocaleLowerCase().includes(this.trimmedQuery)
            );
          })
      };
      return this.movies;
    },
    paginatedMovies: function() {
      const start = this.page * this.moviesPerPage;
      const end = start + this.moviesPerPage;
      return this.filteredMovies.slice(start, end);
    },
    maxPage: function() {
      console.log(this.filteredMovies.length, this.moviesPerPage)
      return Math.ceil(this.filteredMovies.length / this.moviesPerPage) - 1;
    },
    unfinishedMovies: function() {
      return this.filteredMovies.filter(m => m.watchStatus === WatchStatus.WATCHING);
    }
  },
  created: function () {
    MoviesService.getMovies().then(
      (movies) => {
        movies.sort(movieSorter);
        this.movies = movies;
      }
    )
  },
  template: `
    <div id="movies">
        <player v-if="selectedEpisode" :movie="selectedMovie" :episode="selectedEpisode"></player>
        <h2 v-if="unfinishedMovies.length > 0">Unfinished movies</h2>
        <div class="row" v-if="unfinishedMovies.length > 0">
            <div class="col-md-3 col-xs-6" v-for="movie in unfinishedMovies" :key="movie.tmdbId">
                <movie-cover :movie="movie"></movie-cover>
            </div>
        </div>
        <hr v-if="unfinishedMovies.length > 0"/>
        <div class="row">
            <h2 class="col-md-9">All movies</h2>
            <div class="col-md-3">
                <input type="search" v-model="query" class="form-control" placeholder="Search movies">
            </div>
        </div>
        <spinner v-if="movies.length === 0"></spinner>
        <div class="row">
            <div class="col-md-3 col-xs-6" v-for="movie in paginatedMovies" :key="movie.tmdbId" v-if="movie.isConverted || !onlyShowConvertedMovies">
                <movie-cover :movie="movie"></movie-cover>
            </div>
        </div>
        <div class="text-center">
            <div class="btn-group pagination" role="group" aria-label="...">
                <button v-if="page > 0" @click="page-=1" type="button" class="btn btn-default">Previous page</button>
                <button v-if="page < maxPage" @click="page+=1" type="button" class="btn btn-default">Next page</button>
            </div>
        </div>
    </div>
  `
});