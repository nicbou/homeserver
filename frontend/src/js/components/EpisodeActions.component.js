const MovieActionsComponent = Vue.component('episode-actions', {
  props: ['episode', 'is-movie', 'is-only-episode'],
  data: function() {
    return {
      canWatchMovies: false,
      canManageMovies: false,
      showDownloads: false,
    }
  },
  computed: {
    isConverted: function() {
      return this.episode.conversionStatus === ConversionStatus.CONVERTED
    },
    isConverting: function() {
      return this.episode.conversionStatus === ConversionStatus.CONVERTING
    },
    hasChromecastSupport: function() {
      return !!ChromeCast;
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
        this.$emit('episodeDeleted', this.episode);
      });
    }
  },
  created: function() {
    Permissions.checkPermission('movies_watch').then(value => { this.canWatchMovies = value; });
    Permissions.checkPermission('movies_manage').then(value => { this.canManageMovies = value; });
  },
  template: `
    <div class="list-group" v-if="canWatchMovies">
      <button v-if="isConverted" :href="episode.playbackUrl" v-on:click.prevent="play()" title="Play in browser" class="list-group-item">
        <span class="glyphicon glyphicon-play"></span>
        Play in browser
      </button>
      <chromecast-button v-if="isConverted && hasChromecastSupport" :episode="episode" class="list-group-item">
        <img src="/images/chromecast.svg" class="chromecast-icon"/> Play on Chromecast
      </chromecast-button>
      <a :href="episode.originalVideoUrl" class="list-group-item" v-on:click.prevent="showDownloads = !showDownloads">
        <span class="glyphicon glyphicon-save"></span>
        Download
        <span v-show="showDownloads" class="glyphicon glyphicon-menu-up pull-right"></span>
        <span v-show="!showDownloads" class="glyphicon glyphicon-menu-down pull-right"></span>
      </a>
      <a :href="episode.originalVideoUrl" download class="list-group-item list-group-subitem" v-if="showDownloads">
        Download original version
        <br><small>Better quality</small>
      </a>
      <a :href="episode.convertedVideoUrl" download class="list-group-item list-group-subitem" v-if="showDownloads">
        Download mobile version
        <br><small>Smaller file, plays everywhere</small>
      </a>
      <a :href="episode.srtSubtitlesUrlEn" download class="list-group-item list-group-subitem" v-if="showDownloads">
        Download subtitles
      </a>
      <a href="#" v-if="!episode.lastWatched" v-on:click.prevent="markAsWatched()" class="list-group-item">
        <span class="glyphicon glyphicon-eye-open"></span> Mark as seen
      </a>
      <a href="#" v-if="episode.lastWatched" v-on:click.prevent="markAsUnwatched()" class="list-group-item">
        <span class="glyphicon glyphicon-eye-close"></span> Mark as not seen
      </a>
      <a href="#" title="Delete" v-if="canManageMovies" v-on:click.prevent="deleteEpisode()" class="list-group-item">
        <span class="glyphicon glyphicon-trash"></span>
        <span v-if="!isOnlyEpisode">Delete <span v-if="isMovie">part</span><span v-if="!isMovie">episode</span></span>
        <span v-if="isOnlyEpisode">Delete <span v-if="isMovie">movie</span><span v-if="!isMovie">episode</span></span>
      </a>
    </div>
  `
});