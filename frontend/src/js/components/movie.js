import AdminMenuComponent from './../components/episode-admin-menu.js';
import DownloadMenuComponent from './../components/episode-download-menu.js';
import EpisodeListItemComponent from './../components/episode-list-item.js';
import StarComponent from './star.js';
import { MediaType } from './../models/movies.js';

export default Vue.component('movie', {
  data(){
    return {
      currentSeasonNumber: null,
      canManageMovies: false,
      downloadMenuVisible: false,
      adminMenuVisible: false,
      downloadMenuVisible: false,
    }
  },
  mounted(){
    this.$store.dispatch('movies/getMovie', this.$route.params.tmdbId);
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.canManageMovies = userSettings.permissions.includes('movies_manage');
    });
  },
  computed: {
    movie(){
      return this.$store.state.movies.movies[this.$route.params.tmdbId] || null;
    },
    episodeList(){
      return this.movie.episodeList;
    },
    currentSeason(){
      const seasonNumber = this.currentSeasonNumber || (this.movie.nextEpisodeToPlay && this.movie.nextEpisodeToPlay.season);
      return this.movie.seasons.find(s => s.seasonNumber === seasonNumber) || this.movie.seasons[0];
    },
    nextEpisode(){
      return this.movie.nextEpisodeToPlay || this.movie.episodeList[0];
    },
    nextEpisodeName(){
      return this.nextEpisode ? `S${this.nextEpisode.season}E${this.nextEpisode.episode}` : null;
    },
    infoUrl() {
      const type = this.movie.mediaType === MediaType.MOVIE ? 'movie' : 'tv';
      return `https://www.themoviedb.org/${type}/${this.movie.tmdbId}`;
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
    }
  },
  template: `
    <div v-if="movie" class="container" :key="movie.tmdbId">
      <div class="section movie-info">
        <div class="cover">
          <img :src="movie.coverUrl" loading="lazy"/>
        </div>
        <div class="information">
          <div class="section description">
            <h2>
              {{movie.title}}
              <time v-text="movie.releaseYear"></time>
            </h2>
            <p v-text="movie.description"></p>
            <p><a :href="infoUrl" target="_blank">Info and trailer →</a></p>
            <div class="button-group horizontal">
              <a title="Play in browser" href="#" @click.prevent="playEpisode(nextEpisode)" v-if="nextEpisode && nextEpisode.isConverted" class="button large main">
                <i class="fas fa-play"></i>
                Play
                <span class="label" v-if="episodeList.length > 1">{{ nextEpisodeName }}</span>
              </a>
              <a title="Mark as seen" class="button large" href="#" v-if="nextEpisode && !nextEpisode.isWatched" @click.prevent="markEpisodeAsWatched(nextEpisode)">
                <i class="far fa-check-circle"></i>
                Seen
              </a>
              <a title="Mark as not seen" class="button large" href="#" v-if="nextEpisode && nextEpisode.isWatched" @click.prevent="markEpisodeAsUnwatched(nextEpisode)">
                <i class="fas fa-check-circle"></i>
                Seen
              </a>
              <star :movie="movie" class="button large">Star</star>
              <a title="Download movie and subtitles" href="#" class="button large" @click.prevent="downloadMenuVisible = !downloadMenuVisible;adminMenuVisible = false">
                <i class="fas fa-download"></i>
                Save
              </a>
              <a title="Administrator options" class="button large" href="#" v-if="canManageMovies" @click.prevent="adminMenuVisible = !adminMenuVisible;downloadMenuVisible = false">
                <i class="fas fa-ellipsis-h"></i>
              </a>
            </div>
            <download-menu v-if="downloadMenuVisible && nextEpisode" class="button-group vertical" :episode="nextEpisode" :movie="movie"></download-menu>
            <admin-menu v-if="adminMenuVisible && nextEpisode" class="button-group vertical" :movie="movie"></admin-menu>
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