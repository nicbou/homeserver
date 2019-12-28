const MovieComponent = Vue.component('movie', {
  data: function() {
    return {
      movie: null,
      currentSeason: null,
      canWatchMovies: false,
      canManageMovies: false,
      downloadMenuVisible: false,
      adminMenuVisible: false,
      downloadMenuVisible: false,
    }
  },
  mounted: function () {
    MoviesService.getMovies().then((movies) => {
      this.movie = movies.find(m => m.tmdbId === this.$route.params.tmdbId);
      this.currentSeason = this.movie.seasons.find(s => s.seasonNumber === this.movie.nextEpisodeToPlay.season) || this.movie.seasons[0];
    });
    Permissions.checkPermission('movies_watch').then(value => this.canWatchMovies = value);
    Permissions.checkPermission('movies_manage').then(value => this.canManageMovies = value);
  },
  computed: {
    nextEpisodeName: function () {
      const nextEpisode = this.movie.nextEpisodeToPlay;
      return `S${nextEpisode.season}E${nextEpisode.episode}`
    },
  },
  methods: {
    playEpisode: function(episode) {
      this.$router.push({
        name: 'episode',
        params: {
          tmdbId: this.movie.tmdbId,
          episodeId: episode.id,
        },
      });
    },
    deleteEpisode: function() {
      MoviesService.delete(this.episode.id);
      this.$router.push({name: 'movies'});
    },
    markEpisodeAsWatched: function(episode) {
      MoviesService.markAsWatched(episode.id).then(() => {
        episode.lastWatched = moment();
      });
    },
    markEpisodeAsUnwatched: function(episode) {
      MoviesService.markAsUnwatched(episode.id).then(() => {
        episode.lastWatched = null;
      });
    },
  },
  template: `
    <div v-if="movie" class="container">
      <div class="section movie-info">
        <img class="cover" :src="movie.coverUrl" :key="movie.tmdbId"/>
        <div class="information">
          <div class="section description">
            <h2>{{ movie.title }}</h2>
            <p>{{ movie.description }}</p>
            <div class="button-group horizontal">
              <a href="#" @click.prevent="playEpisode(movie.nextEpisodeToPlay)" v-if="canWatchMovies" class="button large main">
                <i class="fas fa-play"></i>
                <span v-if="this.movie.episodes.length === 1">Play</span>
                <span v-if="this.movie.episodes.length > 1">Play {{ nextEpisodeName }}</span>
              </a>
              <chromecast-button :episode="movie.nextEpisodeToPlay" v-if="canWatchMovies" class="button large">
                <i class="fab fa-chromecast"></i>
              </chromecast-button>
              <a href="#" class="button large" v-if="canWatchMovies" @click.prevent="downloadMenuVisible = !downloadMenuVisible;adminMenuVisible = false">
                <i class="fas fa-download"></i>
              </a>
              <a class="button large" href="#" v-if="canManageMovies" @click.prevent="adminMenuVisible = !adminMenuVisible;downloadMenuVisible = false">
                <i class="fas fa-ellipsis-h"></i>
              </a>
            </div>
            <download-menu v-if="downloadMenuVisible" class="button-group vertical" :episode="movie.nextEpisodeToPlay" :movie="movie"></download-menu>
            <admin-menu v-if="adminMenuVisible" class="button-group vertical" :episode="movie.nextEpisodeToPlay" :movie="movie"></admin-menu>
          </div>
          <div class="section episodes" v-if="this.movie.episodes.length > 1">
            <div class="tab-group">
              <h3 class="title">Season</h3>
              <span
                @click="currentSeason = season"
                :class="{ selected: currentSeason.seasonNumber === season.seasonNumber }" class="tab"
                v-for="season in movie.seasons">
                {{ season.seasonNumber }}
              </span>
            </div>
            <div class="tab-body">
              <episode-list-item v-for="episode in currentSeason" :episode="episode" :movie="movie" :key="episode.id"></episode-list-item>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
});