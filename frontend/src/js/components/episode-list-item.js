import ChromeCast from './../services/chromecast.js';
import ChromeCastButtonComponent from './../components/chromecast-button.js';
import AdminMenuComponent from './../components/episode-admin-menu.js';
import DownloadMenuComponent from './../components/episode-download-menu.js';

export default Vue.component('episode-list-item', {
  props: ['episode', 'movie'],
  data: function() {
    return {
      downloadMenuVisible: false,
      adminMenuVisible: false,
      canWatchMovies: false,
      canManageMovies: false,
    };
  },
  mounted: function () {
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.canWatchMovies = userSettings.permissions.includes('movies_watch');
      this.canManageMovies = userSettings.permissions.includes('movies_manage');
    });
  },
  computed: {
    expanded: function() {
      return this.downloadMenuVisible || this.adminMenuVisible;
    }
  },
  methods: {
    playEpisode: function() {
      this.$router.push({
        name: 'episode',
        params: {
          tmdbId: this.movie.tmdbId,
          episodeId: this.episode.id,
        },
      });
    },
    deleteEpisode: function() {
      this.$store.dispatch('movies/deleteEpisode', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    markEpisodeAsWatched: function() {
      this.$store.dispatch('movies/markEpisodeAsWatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    markEpisodeAsUnwatched: function() {
      this.$store.dispatch('movies/markEpisodeAsUnwatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    hasChromecastSupport: function() {
      return !!ChromeCast.isSupported();
    },
  },
  template: `
    <div class="episode collapsible" :class="{expanded: expanded}">
      <div class="collapsible-header">
        <a title="Mark as seen" class="button" href="#" v-if="!episode.isWatched" @click.prevent="markEpisodeAsWatched">
          <i class="far fa-circle"></i>
        </a>
        <a title="Mark as not seen" class="button" href="#" v-if="episode.isWatched" @click.prevent="markEpisodeAsUnwatched">
          <i class="fas fa-check-circle"></i>
        </a>
        <span class="title">Episode {{ episode.episode }}</span>
        <div class="button-group horizontal">
          <a class="button icon-only" v-if="episode.isConverting" title="Video is converting for web playback">
            <i class="fa fa-spinner fa-spin"></i>
          </a>
          <a class="button icon-only" v-if="episode.isConversionFailed" title="Video conversion failed">
            <i class="fas fa-exclamation-triangle"></i>
          </a>
          <a title="Play in browser" class="button icon-only" href="#" v-if="canWatchMovies && episode.isConverted" :href="episode.playbackUrl" @click.prevent="playEpisode">
            <i class="fas fa-play"></i>
          </a>
          <chromecast-button title="Play on ChromeCast" class="button icon-only" v-if="canWatchMovies && episode.isConverted && hasChromecastSupport" :episode="episode">
            <i class="fab fa-chromecast"></i>
          </chromecast-button>
          <a title="Download movie and subtitles" class="button icon-only" :class="{selected: downloadMenuVisible}" href="#" v-if="canWatchMovies" @click.prevent="downloadMenuVisible = !downloadMenuVisible;adminMenuVisible = false">
            <i class="fas fa-download"></i>
          </a>
          <a title="Administrator options" class="button icon-only" :class="{selected: adminMenuVisible}" href="#" v-if="canManageMovies" @click.prevent="adminMenuVisible = !adminMenuVisible;downloadMenuVisible = false">
            <i class="fas fa-ellipsis-h"></i>
          </a>
        </div>
      </div>
      <download-menu
        v-if="downloadMenuVisible"
        class="collapsible-body button-group vertical"
        :episode="episode"
        :movie="movie">
      </download-menu>
      <admin-menu
        v-if="adminMenuVisible"
        class="collapsible-body button-group vertical"
        :episode="episode"
        :movie="movie">
      </admin-menu>
    </div>
  `,
});