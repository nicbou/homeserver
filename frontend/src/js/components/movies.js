import { movieSorter, WatchStatus } from './../models/movies.js';
import SpinnerComponent from './spinner.js';
import StarComponent from './star.js';

// List of movie covers
export default Vue.component('movies', {
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
      return this.$route.query.q || null;
    },
    page: function() {
      return parseInt(this.$route.query.p) || 0;
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
    starredOrUnfinishedMovies: function() {
      return this.filteredMovies.filter(m => (m.isStarred || m.watchStatus === WatchStatus.WATCHING));
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
      const navParams = {
        name: 'movies',
        query: {}
      };
      if (page > 0) navParams.query.p = page;
      if (this.query) navParams.query.q = this.query;

      this.$router.push(navParams);
    },
    setQuery: function(query) {
      // Note: the page number is reset when the query changes
      const navParams = {
        name: 'movies',
        query: {}
      };
      if (query) navParams.query.q = query;

      // Don't amend browser history for each keystroke
      this.query ? this.$router.replace(navParams) : this.$router.push(navParams);

    },
    onSearchChanged: function(event) {
      this.setQuery(event.target.value.trim());
    },
  },
  template: `
    <div id="movies" class="container">
      <h2 v-if="starredOrUnfinishedMovies.length > 0 && page === 0">Starred or unfinished</h2>
      <div class="covers" v-if="page === 0">
        <div class="cover" v-for="movie in starredOrUnfinishedMovies" :key="movie.tmdbId">
          <img @click="openMovie(movie)" :src="movie.coverUrl" loading="lazy"/>
          <star :movie="movie"></star>
        </div>
      </div>
      <input id="search-box" class="input" type="search" :value="query" @input="onSearchChanged" placeholder="Search movies">
      <h2 v-if="query">Results</h2>
      <h2 v-if="!query && page === 0">All movies</h2>
      <h2 v-if="!query && page > 0">More movies...</h2>
      <spinner v-if="movies.length === 0"></spinner>
      <p v-if="movies.length > 0 && filteredMovies.length === 0">No movies found</p>
      <div class="covers">
        <div class="cover" v-for="movie in paginatedMovies" :key="movie.tmdbId">
          <img @click="openMovie(movie)" :src="movie.coverUrl" loading="lazy"/>
          <star :movie="movie"></star>
        </div>
      </div>
      <div class="button-group horizontal">
        <button @click="setPage(page - 1)" class="button" v-if="page > 0">Previous page</button>
        <button @click="setPage(page + 1)" class="button" v-if="page < maxPage">Next page</button>
      </div>
    </div>
  `
});