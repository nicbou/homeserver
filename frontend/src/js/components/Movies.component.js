const MoviesComponent = Vue.component('movies', {
  data: function() {
    return {
      page: 0,
      moviesPerPage: 20,
      query: '',
    }
  },
  computed: {
    movies: function() {
      return Object.values(this.$store.state.movies);
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
      return Math.ceil(this.filteredMovies.length / this.moviesPerPage) - 1;
    },
    unfinishedMovies: function() {
      return this.filteredMovies.filter(m => m.watchStatus === WatchStatus.WATCHING);
    }
  },
  created: function () {
    this.$store.dispatch('getMovies');
  },
  methods: {
    openMovie: function(movie) {
      this.$router.push({ name: 'movie', params: { tmdbId: movie.tmdbId } });
    }
  },
  template: `
    <div id="movies" class="container">
      <h2 v-if="unfinishedMovies.length > 0">Unfinished movies</h2>
      <div class="covers">
        <img @click="openMovie(movie)" class="cover" :src="movie.coverUrl" v-for="movie in unfinishedMovies" :key="movie.tmdbId"/>
      </div>
      <input id="search-box" type="search" v-model="query" placeholder="Search movies"><h2>All movies</h2>
      <spinner v-if="movies.length === 0"></spinner>
      <div class="covers">
        <img @click="openMovie(movie)" class="cover" :src="movie.coverUrl" v-for="movie in paginatedMovies" :key="movie.tmdbId"/>
      </div>
      <div class="button-group horizontal">
        <button class="button" v-if="page > 0" @click="page-=1" type="button">Previous page</button>
        <button class="button" v-if="page < maxPage" @click="page+=1" type="button">Next page</button>
      </div>
    </div>
  `
});