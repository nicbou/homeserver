import { WatchStatus } from './../models/movies.js';
import SpinnerComponent from './spinner.js';
import StarComponent from './star.js';

// List of movie covers
export default Vue.component('movies', {
  data() {
    return {
      queryDebounceTimeout: null,
      cleaningMode: false,
      isAdmin: false,
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
          if(a.isStarred !== b.isStarred){
            return Number(b.isStarred) - Number(a.isStarred);
          }

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
          if(a.isStarred !== b.isStarred){
            return Number(b.isStarred) - Number(a.isStarred);
          }

          return a.dateAdded - b.dateAdded;
        }
      }
      else {
        return (a, b) => {
          if(a.isStarred !== b.isStarred){
            return Number(b.isStarred) - Number(a.isStarred);
          }

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
      let results = this.movies;

      if(this.cleaningMode){
        results = results.filter(m => m.needsCleaning);
      }

      if(this.query) {
        const lowerCaseQuery = this.query.toLocaleLowerCase();
        return results.filter(movie => {
          return (
            lowerCaseQuery === ''
            || movie.title.toLocaleLowerCase().includes(lowerCaseQuery)
            || movie.description.toLocaleLowerCase().includes(lowerCaseQuery)
          );
        })
      };
      return results;
    },
  },
  created() {
    this.$store.dispatch('movies/getMovies');
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.isAdmin = userSettings.isAdmin;
    });
  },
  methods: {
    openMovie(movie) {
      this.$router.push({ name: 'movie', params: { tmdbId: movie.tmdbId } });
    },
    setQuery(query) {
      // Note: the page number is reset when the query changes
      const navParams = {
        name: 'movies',
        query: {}
      };
      if (query) navParams.query.q = query;
      if (this.$route.query.sort) navParams.query.sort = this.$route.query.sort;

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

      const nextIndex = (sortOrder.indexOf(this.$route.query.sort || 'fresh') + 1) % sortOrder.length;
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
      <div class="filters">
        <input class="input" type="search" :value="query" @input="onSearchChanged" placeholder="Search movies">
        <button class="button" @click="setSortType"><i class="fas fa-sort-amount-down"></i> {{ sortType }}</button>
        <button class="button" @click="shuffleMovies"><i class="fas fa-random"></i> Shuffle</button>
        <button v-if="isAdmin" class="button" @click="cleaningMode = !cleaningMode"><i class="fas fa-broom"></i></button>
      </div>
      <spinner v-if="movies.length === 0"></spinner>
      <p v-if="movies.length > 0 && filteredMovies.length === 0">No movies found</p>
      <div class="covers">
        <div class="cover" v-for="movie in filteredMovies" :key="movie.tmdbId">
          <img @click="cleaningMode ? deleteOriginalFiles(movie) : openMovie(movie)" :src="movie.coverUrl" loading="lazy"/>
          <div class="icons">
            <star :movie="movie"></star>
            <i class="fas fa-check-circle" title="Seen" v-if="movie.isWatched"></i>
          </div>
        </div>
      </div>
    </div>
  `
});