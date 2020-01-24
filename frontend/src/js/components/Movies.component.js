const MoviesComponent = Vue.component('movies', {
  data: function() {
    return {
      moviesPerPage: 20,
    }
  },
  computed: {
    movies: function() {
      return Object.values(this.$store.state.movies.movies).sort(movieSorter);
    },
    query: function() {
      return this.$store.state.currentQuery;
    },
    page: function() {
      return this.$store.state.currentPage;
    },
    filteredMovies: function() {
      if (this.query) {
        return this.movies
          .filter((movie) => {
            return (
              this.query === ''
              || movie.title.toLocaleLowerCase().includes(this.query)
              || movie.description.toLocaleLowerCase().includes(this.query)
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
      return Math.ceil(this.filteredMovies.length / this.moviesPerPage) - 1;
    },
    unfinishedMovies: function() {
      return this.filteredMovies.filter(m => m.watchStatus === WatchStatus.WATCHING);
    }
  },
  created: function () {
    this.$store.dispatch('movies/getMovies');
  },
  methods: {
    openMovie: function(movie) {
      this.$router.push({ name: 'movie', params: { tmdbId: movie.tmdbId } });
    },
    setPage: function(page) {
      this.$store.commit('SET_CURRENT_PAGE', page);
    },
    setQuery: function(event) {
      this.$store.dispatch('setCurrentQuery', event.target.value);
    },
    clearQuery: function(event) {
      this.$store.dispatch('setCurrentQuery', '');
    }
  },
  template: `
    <div id="movies" class="container">
      <div class="back" v-if="page > 0" @click="setPage(0)" title="Back to first page">
        <i class="fas fa-arrow-left"></i><span class="label">First page</span>
      </div>
      <div class="back" v-if="query && page === 0" @click="clearQuery()" title="Back to first page">
        <i class="fas fa-arrow-left"></i><span class="label">All movies</span>
      </div>
      <h2 v-if="unfinishedMovies.length > 0 && page === 0">Unfinished movies</h2>
      <div class="covers" v-if="page === 0">
        <div class="cover" v-for="movie in unfinishedMovies" :key="movie.tmdbId">
          <img @click="openMovie(movie)" :src="movie.coverUrl"/>
        </div>
      </div>
      <input id="search-box" class="input" type="search" :value="query" @input="setQuery" placeholder="Search movies">
      <h2 v-if="query">Results</h2>
      <h2 v-if="!query && page === 0">All movies</h2>
      <h2 v-if="!query && page > 0">More movies...</h2>
      <spinner v-if="movies.length === 0"></spinner>
      <p v-if="movies.length > 0 && filteredMovies.length === 0">No movies found</p>
      <div class="covers">
        <div class="cover" v-for="movie in paginatedMovies" :key="movie.tmdbId">
          <img @click="openMovie(movie)" :src="movie.coverUrl"/>
        </div>
      </div>
      <div class="button-group horizontal">
        <button @click="setPage(page - 1)" class="button" v-if="page > 0">Previous page</button>
        <button @click="setPage(page + 1)" class="button" v-if="page < maxPage">Next page</button>
      </div>
    </div>
  `
});