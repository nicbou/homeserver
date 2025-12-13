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
  mounted(){
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.isAdmin = userSettings.isAdmin;
    });
  },
  computed: {
    expanded(){
      return this.downloadMenuVisible || this.adminMenuVisible;
    }
  },
  methods: {
    playEpisode(){
      this.$router.push({
        name: 'episode',
        params: {
          tmdbId: this.movie.tmdbId,
          episodeId: this.episode.id,
        },
      });
    },
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
          <a title="Play in browser" class="button icon-only" href="#" v-if="episode.isConverted" :href="episode.playbackUrl" @click.prevent="playEpisode">
            <i class="fas fa-play"></i>
          </a>
          <a title="Download movie and subtitles" class="button icon-only" :class="{selected: downloadMenuVisible}" href="#" @click.prevent="downloadMenuVisible = !downloadMenuVisible;adminMenuVisible = false">
            <i class="fas fa-download"></i>
          </a>
          <a title="Administrator options" class="button icon-only" :class="{selected: adminMenuVisible}" href="#" v-if="isAdmin" @click.prevent="adminMenuVisible = !adminMenuVisible;downloadMenuVisible = false">
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