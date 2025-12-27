import AdminMenuComponent from './../components/episode-admin-menu.js';
import DownloadMenuComponent from './../components/episode-download-menu.js';

export default Vue.component('episode-list-item', {
  props: ['episode', 'movie'],
  data(){
    return {
      downloadMenuVisible: false,
      adminMenuVisible: false,
      isAdmin: false,
    };
  },
  async mounted(){
    this.isAdmin = (await this.$store.dispatch('users/getUserSettings')).isAdmin;
  },
  computed: {
    expanded(){
      return this.downloadMenuVisible || this.adminMenuVisible;
    }
  },
  methods: {
    deleteEpisode(){
      this.$store.dispatch('movies/deleteEpisode', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    markEpisodeAsWatched(){
      this.$store.dispatch('movies/markEpisodeAsWatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    markEpisodeAsUnwatched(){
      this.$store.dispatch('movies/markEpisodeAsUnwatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
  },
  template: `
    <div class="episode collapsible" :class="{expanded: expanded}">
      <div class="collapsible-header">
        <button title="Mark as seen" class="button" v-if="!episode.isWatched" @click.prevent="markEpisodeAsWatched">
          <i class="far fa-circle"></i>
        </button>
        <button title="Mark as not seen" class="button" v-if="episode.isWatched" @click.prevent="markEpisodeAsUnwatched">
          <i class="fas fa-check-circle"></i>
        </button>
        <span class="title">Episode {{ episode.episode }}</span>
        <div class="button-group horizontal">
          <button class="button icon-only" v-if="episode.isConverting" title="Video is converting for web playback">
            <i class="fa fa-spinner fa-spin"></i>
          </button>
          <router-link title="Play in browser" class="button icon-only" :to="{ name: 'episode', params: { tmdbId: movie.tmdbId, episodeId: episode.id }}">
            <i class="fas fa-play"></i>
          </router-link>
          <button title="Download movie and subtitles" class="button icon-only" :class="{selected: downloadMenuVisible}" @click="downloadMenuVisible = !downloadMenuVisible;adminMenuVisible = false">
            <i class="fas fa-download"></i>
          </button>
          <button title="Administrator options" class="button icon-only" :class="{selected: adminMenuVisible}" v-if="isAdmin" @click="adminMenuVisible = !adminMenuVisible;downloadMenuVisible = false">
            <i class="fas fa-ellipsis-h"></i>
          </button>
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