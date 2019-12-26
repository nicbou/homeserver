const MovieActionsComponent = Vue.component('episode-actions', {
  props: ['episode', 'movie'],
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
    <div class="button-group" v-if="canWatchMovies">
      <a class="button" href="#" v-if="isConverted" :href="episode.playbackUrl" @click.prevent="play()" title="Play in browser">
        <i class="fas fa-play"></i>
      </a>
      <chromecast-button class="button" v-if="isConverted && hasChromecastSupport" :episode="episode">
        <i class="fab fa-chromecast"></i>
      </chromecast-button>
      <a class="button" :href="episode.originalVideoUrl" download v-if="showDownloads">
        <i class="fas fa-download"></i> Original
      </a>
      <a class="button" :href="episode.convertedVideoUrl" download v-if="showDownloads">
        <i class="fas fa-download"></i> Mobile
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlEn" download v-if="showDownloads">
        <i class="far fa-closed-captioning"></i>
      </a>
      <a class="button" href="#" v-if="!episode.lastWatched" @click.prevent="markAsWatched()">
        <i class="fas fa-eye"></i>
      </a>
      <a class="button" href="#" v-if="episode.lastWatched" @click.prevent="markAsUnwatched()">
        <i class="fas fa-eye-slash"></i>
      </a>
      <a class="button" href="#" title="Delete" v-if="canManageMovies" @click.prevent="deleteEpisode()">
        <i class="fas fa-trash-alt"></i>
      </a>
    </div>
  `
});