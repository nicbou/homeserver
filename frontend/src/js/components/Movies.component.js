const MoviesComponent = Vue.component('movies', {
  data: function() {
    return {
      movies: [],
      onlyShowConvertedMovies: false,
      moviesService: new MoviesService(),
      query: ''
    }
  },
  computed: {
    selectedPart: function() {
      console.log(this.movies, this.$route.params.partId, this.movies
        .map(movie => movie.parts)
        .reduce((allParts, parts) => allParts.concat(parts), [])
        .find(part => part.id == this.$route.params.partId))
      return this.movies
        .map(movie => movie.parts)
        .reduce((allParts, parts) => allParts.concat(parts), [])
        .find(part => part.id == this.$route.params.partId);
    },
    trimmedQuery: function() {
      return this.query.trim().toLocaleLowerCase();
    },
    filteredMovies: function() {
      if (this.trimmedQuery) {
        const movies = this.movies.filter((movie) => {
          return movie.title.toLocaleLowerCase().includes(this.trimmedQuery)
            || movie.description.toLocaleLowerCase().includes(this.trimmedQuery)
        });
        return movies
      }
      return this.movies;
    },
    unfinishedMovies: function() {
      return this.filteredMovies.filter(m => m.watchStatus === WatchStatus.WATCHING);
    }
  },
  created: function () {
    this.moviesService.getMovies().then(
      (movies) => {
        movies.sort(movieSorter);
        this.movies = movies;
      },
      () => {
        this.movies = [];
      }
    )
  },
  template: `
    <div id="movies">
        <player v-if="selectedPart" :part="selectedPart"></player>
        <h2 v-if="unfinishedMovies.length > 0">Unfinished movies</h2>
        <div class="row" v-if="unfinishedMovies.length > 0">
            <div class="col-md-3 col-xs-6" v-for="movie in unfinishedMovies">
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
            <div class="col-md-3 col-xs-6" v-for="movie in filteredMovies" v-if="movie.isConverted || !onlyShowConvertedMovies">
                <movie-cover :movie="movie"></movie-cover>
            </div>
        </div>
    </div>
  `
});