import MoviesService from './../services/movies-service.js';
import { MediaType } from './../models/movies.js';
import ChromeCast from './../services/chromecast.js';

export default Vue.component('episode', {
  data: function() {
    return {
      socket: null,
      ignorePlayerEvents: false,
      watchPartyUsers: [],
      watchPartyEnabled: false,
      movie: null,
      episode: null,
      videoElement: null,
      progressInterval: null,
      subtitlesExistEn: false,
      subtitlesExistFr: false,
      subtitlesExistDe: false,
      canWatchMovies: false,
    }
  },
  computed: {
    fullTitle: function() {
      if (this.isMovie) {
        return `${this.movie.title}`;
      }
      return `${this.movie.title}, S${this.episode.season || '?'}E${this.episode.episode || '?'}`;
    },
    episodeIndex: function() {
      return this.movie.episodeList.indexOf(this.episode);
    },
    previousEpisode: function() {
      return this.movie.episodeList[this.episodeIndex-1] || null;
    },
    nextEpisode: function() {
      return this.movie.episodeList[this.episodeIndex+1] || null;
    },
    hasChromecastSupport: function() {
      return !!ChromeCast;
    },
    isMovie: function() {
      return this.movie.mediaType === MediaType.MOVIE;
    },
  },
  methods: {
    saveProgress() {
      // Only save position when video is loaded so a slow connection doesn't
      // erase the previous playback position.
      if (this.$refs.videoElement && this.$refs.videoElement.readyState >= 3) {
        this.$store.dispatch('movies/setEpisodeProgress', {
          tmdbId: this.movie.tmdbId,
          episodeId: this.episode.id,
          progress: this.$refs.videoElement.currentTime,
        });
      }
    },
    markEpisodeAsWatched: function() {
      this.$store.dispatch('movies/markEpisodeAsWatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    markEpisodeAsUnwatched: function() {
      this.$store.dispatch('movies/markEpisodeAsUnwatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    sendPlayerEvent: function(eventType) {
      if(this.watchPartyEnabled && !this.ignorePlayerEvents){
        this.socket.send(JSON.stringify({
          'action': eventType,
          'position': this.$refs.videoElement.currentTime,
        }));
      }
    },
    connectToWatchParty: function(displayName) {
      this.socket = new WebSocket(
        `wss://${window.location.hostname}/api/watchparty/?room=${this.$route.params.episodeId}&user=${displayName}`
      );
      this.$refs.videoElement.addEventListener('playing', _ => this.sendPlayerEvent('play'));
      this.$refs.videoElement.addEventListener('pause', _ => this.sendPlayerEvent('pause'));
      this.$refs.videoElement.addEventListener('seeked', _ => this.sendPlayerEvent('seek'));
      this.socket.addEventListener('message', async event => this.receiveWatchPartyEvent(JSON.parse(event.data)));
    },
    receiveWatchPartyEvent: async function(message) {
      console.log(message);
      this.ignorePlayerEvents = true;

      this.watchPartyUsers = message.users;
      if(this.watchPartyEnabled){
        if (this.$refs.videoElement.currentTime !== message.position){
          this.$refs.videoElement.currentTime = message.position;
        }
        if(message.status === 'playing') {
          await this.$refs.videoElement.play();
        }
        else if(message.status === 'paused') {
          this.$refs.videoElement.pause();
        }
      }
      this.ignorePlayerEvents = false;
    },
  },
  mounted: function () {
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.canWatchMovies = userSettings.permissions.includes('movies_watch');
      if(!this.canWatchMovies) {
        return;
      }

      // Get movie info
      this.$store.dispatch('movies/getMovie', this.$route.params.tmdbId).then(
        movie => {
          this.movie = movie;
          this.episode = this.movie.episodeMap[this.$route.params.episodeId];

          MoviesService.subtitlesExist(this.episode).then(
            availableSubtitles => {
              this.subtitlesExistEn = availableSubtitles.en;
              this.subtitlesExistFr = availableSubtitles.fr;
              this.subtitlesExistDe = availableSubtitles.de;
            }
          )

          this.$nextTick(function () {
            // Save video position
            if (this.episode.isConverted) {
              this.$refs.videoElement.currentTime = this.episode.progress;
              this.progressInterval = setInterval(this.saveProgress, 3000);
            }

            this.connectToWatchParty(userSettings.displayName);
          });
        }
      );
    });
  },
  beforeDestroy: function () {
    clearInterval(this.progressInterval);
    this.saveProgress();
    if(this.socket) {
      this.socket.close();
    }
  },
  template: `
    <div v-if="episode && canWatchMovies" class="container">
      <h2>{{ fullTitle }}</h2>
      <video ref="videoElement" controls autoplay v-if="episode.isConverted" :key="this.episode.id">
        <source :src="episode.convertedVideoUrl" type="video/mp4">
        <track v-if="subtitlesExistEn" label="English" kind="captions" srclang="en" :src="episode.vttSubtitlesUrlEn" default>
        <track v-if="subtitlesExistFr" label="French" kind="captions" srclang="fr" :src="episode.vttSubtitlesUrlFr">
        <track v-if="subtitlesExistDe" label="German" kind="captions" srclang="de" :src="episode.vttSubtitlesUrlDe">
      </video>
      <div v-if="!episode.isConverted">This episode is not converted for web playback.</div>
      <div class="episode-actions">
        <div class="button-group horizontal">
          <a class="button" :class="{'main': watchPartyUsers.length > 1}" @click="watchPartyEnabled = !watchPartyEnabled">
            <i v-if="watchPartyUsers.length <= 1" class="fas fa-user"></i>
            <i v-if="watchPartyUsers.length == 2" class="fas fa-user-friends"></i>
            <i v-if="watchPartyUsers.length > 2" class="fas fa-users"></i>

            <span v-if="!watchPartyEnabled && watchPartyUsers.length > 1">Join party</span>
            <span v-if="!watchPartyEnabled && watchPartyUsers.length <= 1">Start party</span>
            <span v-if="watchPartyEnabled && watchPartyUsers.length > 0">Leave party</span>
          </a>
          <a class="button" v-if="!episode.isWatched" v-on:click.prevent="markEpisodeAsWatched">
            <i class="far fa-check-circle"></i> <span class="no-mobile">Mark as seen</span>
          </a>
          <a class="button" v-if="episode.isWatched" v-on:click.prevent="markEpisodeAsUnwatched">
            <i class="fas fa-check-circle"></i> <span class="no-mobile">Mark as not seen</span>
          </a>
          <star class="button" :movie="movie"></star>
          <chromecast-button v-if="episode.isConverted && hasChromecastSupport" :episode="episode" class="button">
            <i class="fab fa-chromecast"></i>
          </chromecast-button>
          <router-link class="button" v-if="previousEpisode" :to="{ name: 'episode', params: { tmdbId: movie.tmdbId, episodeId: previousEpisode.id }}">
            <i class="fas fa-step-backward"></i>
          </router-link>
          <router-link class="button" v-if="nextEpisode" :to="{ name: 'episode', params: { tmdbId: movie.tmdbId, episodeId: nextEpisode.id }}">
            <i class="fas fa-step-forward"></i>
          </router-link>
        </div>
      </div>
    </div>
  `,
});