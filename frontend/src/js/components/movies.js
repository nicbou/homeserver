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
      return Object.values(this.$store.state.movies.movies).sort(this.movieSorter);
    },
    movieSorter: function() {
      if (this.$route.query.shuffle) {
        Math.seedrandom(this.$route.query.shuffle);
        return () => .5 - Math.random();
      }
      else {
        return movieSorter;
      }
    },
    query: function() {
      return this.$route.query.q || null;
    },
    page: function() {
      return parseInt(this.$route.query.p) || 0;
    },
    filteredMovies: function() {
      if (this.query) {
        const lowerCaseQuery = this.query.toLocaleLowerCase();
        return this.movies
          .filter((movie) => {
            return (
              lowerCaseQuery === ''
              || movie.title.toLocaleLowerCase().includes(lowerCaseQuery)
              || movie.description.toLocaleLowerCase().includes(lowerCaseQuery)
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
    starredMovies: function() {
      return this.filteredMovies.filter(m => m.isStarred);
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
    shuffleMovies: function() {
      const seed = Math.random().toString(36).substr(2, 5);

      // Add the seed to history, to make the shuffling persist navigation
      this.$router.push({
        name: 'movies',
        query: {
          shuffle: seed,
        }
      });
    }
  },
  template: `
    <div id="movies" class="container">
      <h2 v-if="starredMovies.length > 0 && page === 0">Starred movies</h2>
      <div class="covers" v-if="page === 0">
        <div class="cover" v-for="movie in starredMovies" :key="movie.tmdbId">
          <img @click="openMovie(movie)" :src="movie.coverUrl" loading="lazy"/>
          <star :movie="movie"></star>
        </div>
      </div>
      <div class="header-with-controls">
        <h2 v-if="query">Results</h2>
        <h2 v-if="!query && page === 0">All movies</h2>
        <h2 v-if="!query && page > 0">More movies...</h2>
        <button id="shuffle-button" class="button" @click="shuffleMovies"><i class="fas fa-random"></i> Shuffle</button>
        <input id="search-box" class="input" type="search" :value="query" @input="onSearchChanged" placeholder="Search movies">
      </div>
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