const EpisodeAdminMenuComponent = Vue.component('admin-menu', {
  props: ['episode', 'movie'],
  computed: {
  },
  methods: {
    deleteEpisode: function() {
      this.$store.dispatch('deleteEpisode', {
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
    </div>
  `
});