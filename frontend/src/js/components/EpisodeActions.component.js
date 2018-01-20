const MovieActionsComponent = Vue.component('episode-actions', {
  props: ['episode'],
  data: function() {
    return {
      canWatchMovies: false,
      canManageMovies: false,
    }
  },
  computed: {
    isConverted: function() {
      return this.episode.conversionStatus === ConversionStatus.CONVERTED
    },
    isConverting: function() {
      return this.episode.conversionStatus === ConversionStatus.CONVERTING
    }
  },
  methods: {
    play: function() {
      this.$router.push({ name: 'movies', params: { episodeId: this.episode.id } });
    },
    markAsWatched: function() {
      MoviesService.markAsWatched(this.episode.id).then(() => {
        this.episode.lastWatched = moment();
      });
    },
    markAsUnwatched: function() {
      MoviesService.markAsUnwatched(this.episode.id).then(() => {
        this.episode.lastWatched = null;
      });
    },
    deleteEpisode: function() {
      const deletionPromises = MoviesService.delete(this.episode.id).then(() => {
        this.$emit('episodeDeleted');
      });
    },
  },
  created: function() {
    console.log(this.episode)
    Permissions.checkPermission('movies_watch').then(value => { this.canWatchMovies = value; });
    Permissions.checkPermission('movies_manage').then(value => { this.canManageMovies = value; });
  },
  template: `
    <div class="list-group" v-if="canWatchMovies">
      <button v-if="isConverted" :href="episode.playbackUrl" v-on:click.prevent="play()" title="Play in browser" class="list-group-item">
        <span class="glyphicon glyphicon-play"></span>
        Play in browser
      </button>
      <chromecast-button v-if="isConverted" :episode="episode" class="list-group-item">
        <img src="/images/chromecast.svg" class="chromecast-icon"/> Play on Chromecast
      </chromecast-button>
      <a :href="episode.originalVideoUrl" download class="list-group-item">
        <span class="glyphicon glyphicon-save"></span>
        Download
      </a>
      <a href="#" v-if="!episode.lastWatched" v-on:click.prevent="markAsWatched()" class="list-group-item">
        <span class="glyphicon glyphicon-eye-open"></span> Mark as seen
      </a>
      <a href="#" v-if="episode.lastWatched" v-on:click.prevent="markAsUnwatched()" class="list-group-item">
        <span class="glyphicon glyphicon-eye-close"></span> Mark as not seen
      </a>
      <a href="#" title="Delete" v-if="canManageMovies" v-on:click.prevent="deleteEpisode()" class="list-group-item">
        <span class="glyphicon glyphicon-trash"></span>
        Delete episode
      </a>
    </div>
  `
});