const EpisodeListItemComponent = Vue.component('episode-list-item', {
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
    Permissions.checkPermission('movies_watch').then(value => this.canWatchMovies = value);
    Permissions.checkPermission('movies_manage').then(value => this.canManageMovies = value);
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
      this.$store.dispatch('deleteEpisode', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    markEpisodeAsWatched: function() {
      this.$store.dispatch('markEpisodeAsWatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    markEpisodeAsUnwatched: function() {
      this.$store.dispatch('markEpisodeAsUnwatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    hasChromecastSupport: function() {
      return !!ChromeCast;
    },
  },
  template: `
    <div class="episode collapsible" :class="{expanded: expanded}">
      <div class="collapsible-header">
        <a title="Mark as seen" class="button" href="#" v-if="!episode.lastWatched" @click.prevent="markEpisodeAsWatched">
          <i class="far fa-circle"></i>
        </a>
        <a title="Mark as not seen" class="button" href="#" v-if="episode.lastWatched" @click.prevent="markEpisodeAsUnwatched">
          <i class="fas fa-check-circle"></i>
        </a>
        <span class="title">Episode {{ episode.episode }}</span>
        <div class="button-group horizontal">
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