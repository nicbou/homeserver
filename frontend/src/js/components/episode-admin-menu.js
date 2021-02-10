export default Vue.component('admin-menu', {
  props: ['episode', 'movie'],
  computed: {
  },
  methods: {
    deleteEpisode: function() {
      this.$store.dispatch('movies/deleteEpisode', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    convertEpisode: function() {
      this.$store.dispatch('movies/convertEpisode', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    }
  },
  template: `
    <div>
      <a class="button" href="#" @click.prevent="deleteEpisode">
        <i class="fas fa-trash-alt"></i> Delete episode
      </a>
      <a class="button" href="#" @click.prevent="convertEpisode" v-if="!episode.isConverted && !episode.isConverting">
        <i class="fa fa-file-video"></i> Convert episode
      </a>
      <a class="button" href="#" @click.prevent="convertEpisode" v-if="episode.isConverted || episode.isConverting">
        <i class="fa fa-file-video"></i> Reconvert episode
      </a>
    </div>
  `
});