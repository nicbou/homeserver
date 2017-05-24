const MovieCoverComponent = Vue.component('movie-cover', {
  props: ['movie'],
  data: function () {
    return {
      deleted: false
    };
  },
  methods: {
    movieDeleted: function() {
      this.deleted = true;
    }
  },
  template: `
    <div class="movie" :class="{ watched: movie.watched, deleted: deleted }">
      <span class="deleted-icon" v-if="deleted"></span>
      <img v-if="!deleted" class="cover" :src="movie.coverUrl">
      <div v-if="!deleted" class="movie-info">
        <h2 class="hidden-sm hidden-xs">
          {{ movie.title }}
          <br><small>{{ movie.releaseYear }}</small>
        </h2>
        <movie-actions :movie="movie" v-on:movieDeleted="movieDeleted"></movie-actions>
        <p class="hidden-sm hidden-xs">{{ movie.description }}</p>
        <p v-if="movie.dateAdded && !movie.lastWatched" class="text-muted hidden-sm hidden-xs">Added {{ movie.dateAdded.fromNow() }}</p>
        <p v-if="movie.dateAdded && movie.lastWatched" class="text-muted hidden-sm hidden-xs">Added {{ movie.dateAdded.fromNow() }}, watched {{ movie.lastWatched.fromNow() }}</p>
        <p v-if="!movie.dateAdded && movie.lastWatched" class="text-muted hidden-sm hidden-xs">Watched {{ movie.lastWatched.fromNow() }}</p>
      </div>
    </div>
  `,
  components: [
    MovieActionsComponent,
  ]
});