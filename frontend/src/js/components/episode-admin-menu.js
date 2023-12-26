export default Vue.component('admin-menu', {
  props: ['episode', 'movie'],
  data: function() {
    return {
      showDeleteOriginalFile: true,
      showExtractEpisodeSubtitles: true,
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
    extractEpisodeSubtitles: function() {
      this.$store.dispatch('movies/extractEpisodeSubtitles', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
      this.showExtractEpisodeSubtitles = false;
    }
  },
  template: `
    <div>
      <a class="button" href="#" @click.prevent="extractEpisodeSubtitles" v-if="(!episode.isConverted && !episode.isConverting) && showExtractEpisodeSubtitles">
        <i class="far fa-closed-captioning"></i> Extract subtitles
      </a>
      <a class="button" href="#" @click.prevent="extractEpisodeSubtitles" v-if="(episode.isConverted || episode.isConverting) && showExtractEpisodeSubtitles">
        <i class="far fa-closed-captioning"></i> Re-extract subtitles
      </a>
      <a class="button" href="#" @click.prevent="deleteEpisode" v-if="showDeleteEpisode">
        <i class="fas fa-trash-alt"></i> Delete and remove from library
      </a>
      <a class="button" href="#" @click.prevent="deleteOriginalFile" v-if="episode.isConverted && episode.originalVideoPreserved && showDeleteOriginalFile">
        <i class="fas fa-broom"></i> Delete original, keep converted version
      </a>
    </div>
  `
});