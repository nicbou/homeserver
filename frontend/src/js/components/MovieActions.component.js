const MovieActionsComponent = Vue.component('movie-actions', {
  props: ['movie'],
  computed: {
    hasParts: function() {
      return this.movie.parts.length > 1;
    },
  },
  methods: {
    play: function(part) {
      this.$router.push({ name: 'movies', params: { partId: part.id } });
    },
    markAsWatched: function(part) {
      MoviesService.markAsWatched(part.id).then(() => {
        part.lastWatched = moment();
      });
    },
    markAsUnwatched: function(part) {
      MoviesService.markAsUnwatched(part.id).then(() => {
        part.lastWatched = null;
      });
    },
    deleteMovie: function(movie) {
      const deletionPromises = movie.parts.map(part => MoviesService.delete(part.id));
      Promise.all(deletionPromises).then(() => {
        this.$emit('movieDeleted');
      });
    },
    isConverted: function(part) {
      return part.conversionStatus === ConversionStatus.CONVERTED
    },
    isConverting: function(part) {
      return part.conversionStatus === ConversionStatus.CONVERTING
    }
  },
  template: `
    <div class='actions'>
      <div class="btn-group">
        <div v-if="hasParts" class="btn-group">
          <button type="button" class="btn btn-default btn-sm dropdown-toggle btn-play btn-success play-in-browser" title="Play on the big screen" data-toggle="dropdown">
            <span class="glyphicon glyphicon-play"></span>
            <span class="caret"></span>
          </button>
          <ul class="dropdown-menu" role="menu">
            <li v-for="part in movie.parts">
              <a v-if="isConverted(part)" :href="part.playbackUrl" v-on:click.prevent="play(part)" title="Play in browser">
                Play part {{ part.part }} in browser
              </a>
              <a v-if="isConverting(part)">
                <span class="text-muted">Part {{ part.part }} is converting...</span>
              </a>
              <a v-if="!isConverting(part) && !isConverted(part)">
                <span class="text-muted">Part {{ part.part }} is not converted</span>
              </a>
            </li>
          </ul>
        </div>
        <div v-if="hasParts" class="btn-group">
          <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown">
            <span class="glyphicon glyphicon-eye-open"></span>
            <span class="caret"></span>
          </button>
          <ul class="dropdown-menu" role="menu">
            <li v-for="part in movie.parts">
              <a v-if="!part.lastWatched" v-on:click.prevent="markAsWatched(part)">
                Mark part {{ part.partNumber }} as watched
              </a>
              <a v-if="part.lastWatched" v-on:click.prevent="markAsUnwatched(part)">
                Unmark part {{ part.partNumber }} as watched
              </a>
            </li>
          </ul>
        </div>
        <a v-if="!hasParts" v-on:click.prevent="play(movie.parts[0])" :href="movie.parts[0].playbackUrl" title="Play in browser" class="play-in-browser btn btn-success btn-sm">
          <span class="glyphicon glyphicon-play"></span>
        </a>
        <a href="#" v-if="!hasParts && movie.lastWatched" title="Unmark as watched" v-on:click.prevent="markAsUnwatched(movie.parts[0])" class="mark-unwatched btn btn-default btn-sm">
          <span class="glyphicon glyphicon-eye-close"></span>
        </a>
        <a href="#" v-if="!hasParts && !movie.lastWatched" title="Mark as watched" v-on:click.prevent="markAsWatched(movie.parts[0])" class="mark-watched btn btn-default btn-sm">
          <span class="glyphicon glyphicon-eye-open"></span>
        </a>
        <a href="#" title="Delete" v-on:click.prevent="deleteMovie(movie)" class="delete btn btn-default btn-sm">
          <span class="glyphicon glyphicon-trash"></span>
        </a>
      </div>
    </div>
  `
});