export default Vue.component('star', {
  props: ['movie'],
  methods: {
    starMovie: function() {
      const action = this.movie.isStarred ? 'movies/unstarMovie' : 'movies/starMovie';
      this.$store.dispatch(action, {tmdbId: this.movie.tmdbId});
    },
  },
  template: `
    <a title="Star this" href="#" class="star" @click.prevent="starMovie" :class="{starred: movie.isStarred, 'not-starred': !movie.isStarred}">
      <i class="fa-star" :class="{fa: movie.isStarred, far: !movie.isStarred}"></i>
      <slot></slot>
    </a>
  `,
});