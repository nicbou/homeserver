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
      showFilters: false,
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
      return (a, b) => {
        if(this.showStarred && a.isStarred !== b.isStarred){
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
    },
    query() {
      return this.$route.query.q || null;
    },
    showStarred: {
      get() {
        return this.getQueryStringBool("starred");
      },
      set(value){
        this.setQueryStringBool("starred", value);
      }
    },
    showNew: {
      get() {
        return this.getQueryStringBool("new");
      },
      set(value){
        this.setQueryStringBool("new", value);
      }
    },
    showSeen: {
      get() {
        return this.getQueryStringBool("seen");
      },
      set(value){
        this.setQueryStringBool("seen", value);
      }
    },
    showInProgress: {
      get() {
        return this.getQueryStringBool("inprogress");
      },
      set(value){
        this.setQueryStringBool("inprogress", value);
      }
    },
    filteredMovies() {
      let results = this.movies.filter(m => {
        return (
          (this.showSeen && m.isWatched)
          || (this.showNew && !m.isWatched && !m.progress)
          || (this.showInProgress && m.progress && !m.isWatched)
        );
      });

      if(this.cleaningMode){
        results = results.filter(m => m.needsCleaning);
      }

      results = results

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
  async created() {
    this.$store.dispatch('movies/getMovies');
    this.isAdmin = (await this.$store.dispatch('users/getUserSettings')).isAdmin;
  },
  methods: {
    getQueryStringBool(key){
      return this.$route.query[key] === "0" ? false : true;
    },
    setQueryStringBool(key, value){
      const query = {...this.$route.query};
      if(value){
        delete query[key];
      }
      else{
        query[key] = "0";
      }
      this.$router.push({name: 'movies', query});
    },
    openMovie(movie) {
      this.$router.push({ name: 'movie', params: { tmdbId: movie.tmdbId } });
    },
    onSearchChanged(event) {
      clearTimeout(this.queryDebounceTimeout);
      this.queryDebounceTimeout = setTimeout(() => {
        this.$router.push({
          name: 'movies',
          query: Object.assign({}, this.$route.query, {
            q: event.target.value.trim(),
          }),
        });
      }, 200);
    },
    shuffleMovies() {
      this.$router.push({
        name: 'movies',
        query: Object.assign({}, this.$route.query, {
          shuffle: Math.random().toString(36).substr(2, 5),
        }),
      });
    },
    deleteLargeVideos(movie) {
      movie.episodeList.filter(e => e.needsCleaning).forEach(episode => {
        this.$store.dispatch('movies/deleteLargeVideo', {
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
        <button class="button" @click="shuffleMovies"><i class="fas fa-random"></i></button>
        <label class="input">
          <input type="checkbox" v-model="showFilters"> <i class="fas fa-filter"></i>
        </label>
      </div>
      <div class="filters" v-if="showFilters">
        <div class="filter-group">
          <label class="input">
            <input type="checkbox" v-model="showNew">
            <i class="far fa-circle"></i> New
          </label>
          <label class="input">
            <input type="checkbox" v-model="showInProgress">
            <i class="far fa-dot-circle"></i> In progress
          </label>
          <label class="input">
            <input type="checkbox" v-model="showSeen">
            <i class="fas fa-check-circle"></i> Seen
          </label>
        </div>
        <label class="input">
          <input type="checkbox" v-model="showStarred"> <i class="fas fa-star"></i> Starred
        </label>
        <label class="input">
          <input type="checkbox" v-model="cleaningMode">
          <i class="fas fa-broom"></i> Cleaning mode
        </label>
      </div>
      <spinner v-if="movies.length === 0"></spinner>
      <p v-if="movies.length > 0 && filteredMovies.length === 0">No movies found</p>
      <div class="covers">
        <div class="cover" v-for="movie in filteredMovies" :key="movie.tmdbId">
          <progress v-if="movie.percentSeen && movie.percentSeen !== 100" :value="movie.percentSeen" :max="100"/>
          <img @click="cleaningMode ? deleteLargeVideos(movie) : openMovie(movie)" :src="movie.coverUrl" loading="lazy"/>
          <div class="icons">
            <star :movie="movie"></star>
            <i class="fas fa-check-circle" title="Seen" v-if="movie.isWatched"></i>
          </div>
        </div>
      </div>
    </div>
  `
});