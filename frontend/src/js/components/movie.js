import AdminMenuComponent from './../components/episode-admin-menu.js';
import ChromeCast from './../services/chromecast.js';
import ChromeCastButtonComponent from './../components/chromecast-button.js';
import DownloadMenuComponent from './../components/episode-download-menu.js';
import StarComponent from './star.js';

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
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.canWatchMovies = userSettings.permissions.includes('movies_watch');
      this.canManageMovies = userSettings.permissions.includes('movies_manage');
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
      const seasonNumber = this.currentSeasonNumber || (this.movie.nextEpisodeToPlay && this.movie.nextEpisodeToPlay.season);
      return this.movie.seasons.find(s => s.seasonNumber === seasonNumber) || this.movie.seasons[0];
    },
    nextEpisode: function() {
      return this.movie.nextEpisodeToPlay || this.movie.episodeList[0];
    },
    nextEpisodeName: function () {
      return this.nextEpisode ? `S${this.nextEpisode.season}E${this.nextEpisode.episode}` : null;
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
            <h2>
              {{ movie.title }}
              <star :movie="movie"></star>
            </h2>
            <p>{{ movie.description }}</p>
            <div class="button-group horizontal">
              <a title="Mark as seen" class="button large" href="#" v-if="canWatchMovies && nextEpisode && !nextEpisode.isWatched" @click.prevent="markEpisodeAsWatched(nextEpisode)">
                <i class="far fa-check-circle"></i>
              </a>
              <a title="Mark as not seen" class="button large" href="#" v-if="canWatchMovies && nextEpisode && nextEpisode.isWatched" @click.prevent="markEpisodeAsUnwatched(nextEpisode)">
                <i class="fas fa-check-circle"></i>
              </a>
              <a title="Play in browser" href="#" @click.prevent="playEpisode(nextEpisode)" v-if="canWatchMovies && nextEpisode && nextEpisode.isConverted" class="button large main">
                <i class="fas fa-play"></i>
                <span class="label" v-if="episodeList.length > 1">{{ nextEpisodeName }}</span>
              </a>
              <chromecast-button title="Play on ChromeCast" :episode="nextEpisode" v-if="canWatchMovies && nextEpisode && nextEpisode.isConverted && hasChromecastSupport" class="button large">
                <i class="fab fa-chromecast"></i>
              </chromecast-button>
              <a title="Download movie and subtitles" href="#" class="button large" v-if="canWatchMovies" @click.prevent="downloadMenuVisible = !downloadMenuVisible;adminMenuVisible = false">
                <i class="fas fa-download"></i>
              </a>
              <a title="Administrator options" class="button large" href="#" v-if="canManageMovies" @click.prevent="adminMenuVisible = !adminMenuVisible;downloadMenuVisible = false">
                <i class="fas fa-ellipsis-h"></i>
              </a>
            </div>
            <download-menu v-if="downloadMenuVisible && nextEpisode" class="button-group vertical" :episode="nextEpisode" :movie="movie"></download-menu>
            <admin-menu v-if="adminMenuVisible && nextEpisode" class="button-group vertical" :episode="nextEpisode" :movie="movie"></admin-menu>
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