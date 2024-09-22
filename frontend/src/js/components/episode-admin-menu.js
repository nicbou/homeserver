export default Vue.component('admin-menu', {
  props: ['episode', 'movie'],
  data: function() {
    return {
      showDeleteOriginalFile: true,
      showDeleteEpisode: true,
    }
  },
  computed: {
  },
  methods: {
    deleteEpisode: function(episode) {
      this.$store.dispatch('movies/deleteEpisode', {
        tmdbId: this.movie.tmdbId,
        episodeId: episode.id,
      });
      this.showDeleteEpisode = false;
    },
    deleteOriginalFile: function(episode) {
      this.$store.dispatch('movies/deleteOriginalFile', {
        tmdbId: this.movie.tmdbId,
        episodeId: episode.id,
      });
      this.showDeleteOriginalFile = false;
    },
    deleteSeason: function(){
      this.movie.episodeList
        .filter(ep => ep.season === this.episode.season)
        .forEach(ep => this.deleteEpisode(ep))
    },
    deleteAllEpisodes: function(){
      this.movie.episodeList.forEach(ep => this.deleteEpisode(ep));
    },
  },
  template: `
    <div>
      <a class="button" href="#" @click.prevent="deleteEpisode(episode)" v-if="showDeleteEpisode">
        <i class="fas fa-trash-alt"></i> Delete and remove from library
      </a>
      <a class="button" href="#" @click.prevent="deleteOriginalFile(episode)" v-if="episode.isConverted && episode.originalVideoPreserved && showDeleteOriginalFile">
        <i class="fas fa-broom"></i> Delete original, keep converted version
      </a>
      <a class="button" href="#" @click.prevent="deleteSeason" v-if="movie.episodeList && showDeleteEpisode">
        <i class="fas fa-broom"></i> Delete season
      </a>
      <a class="button" href="#" @click.prevent="deleteAllEpisodes" v-if="movie.episodeList && showDeleteEpisode">
        <i class="fas fa-broom"></i> Delete show
      </a>
    </div>
  `
});