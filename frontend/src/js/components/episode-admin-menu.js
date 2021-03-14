export default Vue.component('admin-menu', {
  props: ['episode', 'movie'],
  data: function() {
    return {
      showDeleteOriginalFile: true,
      showConvertEpisode: true,
      showDeleteEpisode: true,
    }
  },
  computed: {
  },
  methods: {
    deleteEpisode: function() {
      this.$store.dispatch('movies/deleteEpisode', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
      this.showDeleteEpisode = false;
    },
    deleteOriginalFile: function() {
      this.$store.dispatch('movies/deleteOriginalFile', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
      this.showDeleteOriginalFile = false;
    },
    convertEpisode: function() {
      this.$store.dispatch('movies/convertEpisode', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
      this.showConvertEpisode = false;
    }
  },
  template: `
    <div>
      <a class="button" href="#" @click.prevent="deleteEpisode" v-if="showDeleteEpisode">
        <i class="fas fa-trash-alt"></i> Delete episode
      </a>
      <a class="button" href="#" @click.prevent="convertEpisode" v-if="(!episode.isConverted && !episode.isConverting) && showConvertEpisode">
        <i class="fa fa-file-video"></i> Convert episode
      </a>
      <a class="button" href="#" @click.prevent="convertEpisode" v-if="(episode.isConverted || episode.isConverting) && showConvertEpisode">
        <i class="fa fa-file-video"></i> Reconvert episode
      </a>
      <a class="button" href="#" @click.prevent="deleteOriginalFile" v-if="episode.isConverted && showDeleteOriginalFile">
        <i class="fa fa-file-video"></i> Delete original file
      </a>
    </div>
  `
});