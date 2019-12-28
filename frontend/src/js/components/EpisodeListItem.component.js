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
      this.$emit('episode-deleted', this.episode);
    },
    markEpisodeAsWatched: function() {
      this.$emit('episode-watched', this.episode);
    },
    markEpisodeAsUnwatched: function() {
      this.$emit('episode-unwatched', this.episode);
    },
    hasChromecastSupport: function() {
      return !!ChromeCast;
    },
  },
  template: `
    <div class="episode collapsible" :class="{expanded: expanded}">
      <div class="collapsible-header">
        <a class="button" href="#" v-if="!episode.lastWatched" @click.prevent="markEpisodeAsWatched">
          <i class="far fa-circle"></i>
        </a>
        <a class="button" href="#" v-if="episode.lastWatched" @click.prevent="markEpisodeAsUnwatched">
          <i class="fas fa-check-circle"></i>
        </a>
        <span class="title" @click="playEpisode">Episode {{ episode.episode }}</span>
        <div class="button-group horizontal">
          <a class="button icon-only" href="#" v-if="canWatchMovies && episode.isConverted" :href="episode.playbackUrl" @click.prevent="playEpisode" title="Play in browser">
            <i class="fas fa-play"></i>
          </a>
          <chromecast-button class="button icon-only" v-if="canWatchMovies && episode.isConverted && hasChromecastSupport" :episode="episode">
            <i class="fab fa-chromecast"></i>
          </chromecast-button>
          <a class="button icon-only" :class="{selected: downloadMenuVisible}" href="#" v-if="canWatchMovies" @click.prevent="downloadMenuVisible = !downloadMenuVisible;adminMenuVisible = false">
            <i class="fas fa-download"></i>
          </a>
          <a class="button icon-only" :class="{selected: adminMenuVisible}" href="#" v-if="canManageMovies" @click.prevent="adminMenuVisible = !adminMenuVisible;downloadMenuVisible = false">
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
        :movie="movie"
        @episode-deleted="deleteEpisode">
      </admin-menu>
    </div>
  `,
});