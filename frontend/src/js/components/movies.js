import { WatchStatus } from './../models/movies.js';
import SpinnerComponent from './spinner.js';
import StarComponent from './star.js';

// List of movie covers
export default Vue.component('movies', {
  data() {
    return {
      moviesPerPage: 20,
      queryDebounceTimeout: null,
      cleaningMode: false,
      canManageMovies: false,
    }
  },
  computed: {
    movies() {
      return Object.values(this.$store.state.movies.movies).sort(this.movieSorter);
    },
    movieSorter() {
      if (this.$route.query.shuffle) {
        Math.seedrandom(this.$route.query.shuffle);
        return () => .5 - Math.random();
      }
      else if (this.$route.query.sort === 'lastSeen'){
        return (a, b) => {
          if (a.lastWatched && b.lastWatched) {
            return b.lastWatched - a.lastWatched;
          } else if (a.lastWatched) {
            return -1;
          } else if (b.lastWatched) {
            return 1;
          } else {
            return a.dateAdded - b.dateAdded;
          }
        }
      }
      else if (this.$route.query.sort === 'firstAdded'){
        return (a, b) => {
          return a.dateAdded - b.dateAdded;
        }
      }
      else {
        return (a, b) => {
          if (a.lastWatched && b.lastWatched) {
            return a.lastWatched - b.lastWatched;
          } else if (a.lastWatched) {
            return 1;
          } else if (b.lastWatched) {
            return -1;
          } else {
            return b.dateAdded - a.dateAdded;
          }
        };
      }
    },
    query() {
      return this.$route.query.q || null;
    },
    page() {
      return parseInt(this.$route.query.p) || 0;
    },
    sortType() {
      return {
        'fresh': 'New on Nickflix',
        'firstAdded': 'First added',
        'lastSeen': 'Watched recently',
        'newest': 'Newest releases',
        'oldest': 'Oldest releases',
      }[this.$route.query.sort || 'fresh'];
    },
    filteredMovies() {
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
    paginatedMovies() {
      const start = this.page * this.moviesPerPage;
      const end = start + this.moviesPerPage;
      return this.filteredMovies.slice(start, end);
    },
    maxPage() {
      return Math.ceil(this.filteredMovies.length / this.moviesPerPage) - 1;
    },
    starredMovies() {
      return this.filteredMovies.filter(m => m.isStarred);
    },
  },
  created() {
    this.$store.dispatch('movies/getMovies');
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.canManageMovies = userSettings.permissions.includes('movies_manage');
    });
  },
  methods: {
    openMovie(movie) {
      this.$router.push({ name: 'movie', params: { tmdbId: movie.tmdbId } });
    },
    setPage(page) {
      const navParams = {
        name: 'movies',
        query: {}
      };
      if (page > 0) navParams.query.p = page;
      if (this.query) navParams.query.q = this.query;

      this.$router.push(navParams);
    },
    setQuery(query) {
      // Note: the page number is reset when the query changes
      const navParams = {
        name: 'movies',
        query: {}
      };
      if (query) navParams.query.q = query;
      if(this.$route.query.sort) navParams.query.sort = this.$route.query.sort;

      // Don't amend browser history for each keystroke
      this.query ? this.$router.replace(navParams) : this.$router.push(navParams);
    },
    setSortType(){
      const sortOrder = [
        'fresh',
        'firstAdded',
        'lastSeen',
        'newest',
        'oldest',
      ];
      const nextIndex = (sortOrder.indexOf(this.$route.query.sort || 'fresh') + 1) % (sortOrder.length - 1);
      const nextSortType = sortOrder[nextIndex];

      const navParams = {
        name: 'movies',
        query: {
          sort: nextSortType,
        },
      };
      if (this.query) navParams.query.q = this.query;

      this.$router.push(navParams);
    },
    onSearchChanged(event) {
      clearTimeout(this.queryDebounceTimeout);
      this.queryDebounceTimeout = setTimeout(() => {
        this.setQuery(event.target.value.trim());
      }, 200);
    },
    shuffleMovies() {
      const seed = Math.random().toString(36).substr(2, 5);

      // Add the seed to history, to make the shuffling persist navigation
      this.$router.push({
        name: 'movies',
        query: {
          shuffle: seed,
        }
      });
    },
    deleteOriginalFiles: function(movie) {
      movie.episodeList.filter(e => e.needsCleaning).forEach(episode => {
        this.$store.dispatch('movies/deleteOriginalFile', {
          tmdbId: movie.tmdbId,
          episodeId: episode.id,
        });
      });
    },
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
        <button id="sort-button" class="button" @click="setSortType"><i class="fas fa-sort-amount-down"></i> {{ sortType }}</button>
        <button id="shuffle-button" class="button" @click="shuffleMovies"><i class="fas fa-random"></i> Shuffle</button>
        <button id="clean-button" v-if="canManageMovies" class="button" @click="cleaningMode = !cleaningMode"><i class="fas fa-broom"></i></button>
        <input id="search-box" class="input" type="search" :value="query" @input="onSearchChanged" placeholder="Search movies">
      </div>
      <spinner v-if="movies.length === 0"></spinner>
      <p v-if="movies.length > 0 && filteredMovies.length === 0">No movies found</p>
      <div class="covers" :class="{'cleaning-mode': cleaningMode}">
        <div class="cover" :class="{'needs-cleaning': movie.needsCleaning}" v-for="movie in paginatedMovies" :key="movie.tmdbId">
          <img @click="openMovie(movie)" :src="movie.coverUrl" loading="lazy"/>
          <star :movie="movie"></star>
          <button v-if="cleaningMode && movie.needsCleaning" class="button clean" @click="deleteOriginalFiles(movie)"><i class="fas fa-broom"></i></button>
        </div>
      </div>
      <div class="button-group horizontal">
        <button @click="setPage(page - 1)" class="button" v-if="page > 0">Previous page</button>
        <button @click="setPage(page + 1)" class="button" v-if="page < maxPage">Next page</button>
      </div>
    </div>
  `
});