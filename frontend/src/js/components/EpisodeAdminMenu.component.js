const EpisodeAdminMenuComponent = Vue.component('admin-menu', {
  props: ['episode', 'movie'],
  computed: {
  },
  methods: {
    deleteEpisode: function() {
      this.$emit('episode-deleted', this.episode);
    }
  },
  template: `
    <div>
      <a class="button" href="#" @click.prevent="deleteEpisode">
        <i class="fas fa-trash-alt"></i> Delete from library
      </a>
    </div>
  `
});