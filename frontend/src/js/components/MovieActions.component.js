const MovieActionsComponent = Vue.component('movie-actions', {
  props: ['movie'],
  computed: {
    hasEpisodes: function() {
      return this.movie.episodes.length > 1;
    },
  },
  methods: {
    play: function(episode) {
      this.$router.push({ name: 'movies', params: { episodeId: episode.id } });
    },
    markAsWatched: function(episode) {
      MoviesService.markAsWatched(episode.id).then(() => {
        episode.lastWatched = moment();
      });
    },
    markAsUnwatched: function(episode) {
      MoviesService.markAsUnwatched(episode.id).then(() => {
        episode.lastWatched = null;
      });
    },
    deleteMovie: function(movie) {
      const deletionPromises = movie.episodes.map(episode => MoviesService.delete(episode.id));
      Promise.all(deletionPromises).then(() => {
        this.$emit('movieDeleted');
      });
    },
    isConverted: function(episode) {
      return episode.conversionStatus === ConversionStatus.CONVERTED
    },
    isConverting: function(episode) {
      return episode.conversionStatus === ConversionStatus.CONVERTING
    }
  },
  template: `
    <div class='actions'>
      <div class="btn-group">
        <div v-if="hasEpisodes" class="btn-group">
          <button type="button" class="btn btn-default btn-sm dropdown-toggle btn-play btn-success play-in-browser" title="Stream this movie" data-toggle="dropdown">
            <span class="glyphicon glyphicon-play"></span>
            <span class="caret"></span>
          </button>
          <ul class="dropdown-menu" role="menu">
            <li v-for="episode in movie.episodes">
              <a v-if="isConverted(episode)" :href="episode.playbackUrl" v-on:click.prevent="play(episode)" title="Play in browser">
                Play {{ episode.episodeString }} in browser
              </a>
              <a v-if="isConverting(episode)">
                <span class="text-muted">{{ episode.episodeString }} is converting...</span>
              </a>
              <a v-if="!isConverting(episode) && !isConverted(episode)">
                <span class="text-muted">{{ episode.episodeString }} is not converted</span>
              </a>
            </li>
          </ul>
        </div>
        <div v-if="hasEpisodes" class="btn-group">
          <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown">
            <span class="glyphicon glyphicon-eye-open"></span>
            <span class="caret"></span>
          </button>
          <ul class="dropdown-menu" role="menu">
            <li v-for="episode in movie.episodes">
              <a v-if="!episode.lastWatched" v-on:click.prevent="markAsWatched(episode)">
                Mark {{ episode.episodeString }} as watched
              </a>
              <a v-if="episode.lastWatched" v-on:click.prevent="markAsUnwatched(episode)">
                Unmark {{ episode.episodeString }} as watched
              </a>
            </li>
          </ul>
        </div>
        <a v-if="!hasEpisodes && isConverted(movie.episodes[0])" v-on:click.prevent="play(movie.episodes[0])" :href="movie.episodes[0].playbackUrl" title="Stream this movie" class="play-in-browser btn btn-success btn-sm">
          <span class="glyphicon glyphicon-play"></span>
        </a>
        <a v-if="!hasEpisodes && !isConverted(movie.episodes[0])" title="This movie is not converted" class="play-in-browser btn btn-success btn-sm disabled">
          <span class="glyphicon glyphicon-play"></span>
        </a>
        <a href="#" v-if="!hasEpisodes && movie.lastWatched" title="Unmark as watched" v-on:click.prevent="markAsUnwatched(movie.episodes[0])" class="mark-unwatched btn btn-default btn-sm">
          <span class="glyphicon glyphicon-eye-close"></span>
        </a>
        <a href="#" v-if="!hasEpisodes && !movie.lastWatched" title="Mark as watched" v-on:click.prevent="markAsWatched(movie.episodes[0])" class="mark-watched btn btn-default btn-sm">
          <span class="glyphicon glyphicon-eye-open"></span>
        </a>
        <a href="#" title="Delete" v-on:click.prevent="deleteMovie(movie)" class="delete btn btn-default btn-sm">
          <span class="glyphicon glyphicon-trash"></span>
        </a>
      </div>
    </div>
  `
});