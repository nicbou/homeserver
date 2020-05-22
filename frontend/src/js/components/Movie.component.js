import ChromeCast from './ChromeCastService.js';

export default Vue.component('movie', {
  data: function() {
    return {
      currentSeasonNumber: null,
      canWatchMovies: false,
      canManageMovies: false,
      downloadMenuVisible: false,
      adminMenuVisible: false,
      downloadMenuVisible: false,
    }
  },
  mounted: function () {
    this.$store.dispatch('movies/getMovie', this.$route.params.tmdbId);
    this.$store.dispatch('permissions/getPermissions').then(permissions => {
      this.canWatchMovies = permissions.includes('movies_watch');
      this.canManageMovies = permissions.includes('movies_manage');
    });
  },
  computed: {
    movie: function () {
      return this.$store.state.movies.movies[this.$route.params.tmdbId] || null;
    },
    episodeList: function () {
      return this.movie.episodeList;
    },
    currentSeason: function () {
      const seasonNumber = this.currentSeasonNumber || this.movie.nextEpisodeToPlay.season;
      return this.movie.seasons.find(s => s.seasonNumber === seasonNumber) || this.seasons[0];
    },
    nextEpisodeName: function () {
      const nextEpisode = this.movie.nextEpisodeToPlay;
      return `S${nextEpisode.season}E${nextEpisode.episode}`
    },
    hasChromecastSupport: function() {
      return !!ChromeCast;
    }
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
    markEpisodeAsWatched: function(episode) {
      this.$store.dispatch('movies/markEpisodeAsWatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: episode.id,
      });
    },
    markEpisodeAsUnwatched: function(episode) {
      this.$store.dispatch('movies/markEpisodeAsUnwatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: episode.id,
      });
    },
  },
  template: `
    <div v-if="movie" class="container">
      <div class="section movie-info">
        <div class="cover">
          <img :src="movie.coverUrl" :key="movie.tmdbId"/>
        </div>
        <div class="information">
          <div class="section description">
            <h2>{{ movie.title }}</h2>
            <p>{{ movie.description }}</p>
            <div class="button-group horizontal">
              <a title="Mark as seen" class="button large" href="#" v-if="canWatchMovies && !movie.nextEpisodeToPlay.isWatched" @click.prevent="markEpisodeAsWatched(movie.nextEpisodeToPlay)">
                <i class="far fa-check-circle"></i>
              </a>
              <a title="Mark as not seen" class="button large" href="#" v-if="canWatchMovies && movie.nextEpisodeToPlay.isWatched" @click.prevent="markEpisodeAsUnwatched(movie.nextEpisodeToPlay)">
                <i class="fas fa-check-circle"></i>
              </a>
              <a title="Play in browser" href="#" @click.prevent="playEpisode(movie.nextEpisodeToPlay)" v-if="canWatchMovies" class="button large main">
                <i class="fas fa-play"></i>
                <span class="label" v-if="episodeList.length > 1">{{ nextEpisodeName }}</span>
              </a>
              <chromecast-button title="Play on ChromeCast" :episode="movie.nextEpisodeToPlay" v-if="canWatchMovies && movie.nextEpisodeToPlay.isConverted && hasChromecastSupport" class="button large">
                <i class="fab fa-chromecast"></i>
              </chromecast-button>
              <a title="Download movie and subtitles" href="#" class="button large" v-if="canWatchMovies" @click.prevent="downloadMenuVisible = !downloadMenuVisible;adminMenuVisible = false">
                <i class="fas fa-download"></i>
              </a>
              <a title="Administrator options" class="button large" href="#" v-if="canManageMovies" @click.prevent="adminMenuVisible = !adminMenuVisible;downloadMenuVisible = false">
                <i class="fas fa-ellipsis-h"></i>
              </a>
            </div>
            <download-menu v-if="downloadMenuVisible" class="button-group vertical" :episode="movie.nextEpisodeToPlay" :movie="movie"></download-menu>
            <admin-menu v-if="adminMenuVisible" class="button-group vertical" :episode="movie.nextEpisodeToPlay" :movie="movie"></admin-menu>
          </div>
          <div class="section episodes" v-if="episodeList.length > 1">
            <div class="tab-group">
              <h3 class="title">Season</h3>
              <span
                @click="currentSeasonNumber = season.seasonNumber"
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