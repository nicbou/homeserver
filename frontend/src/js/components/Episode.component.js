const EpisodeComponent = Vue.component('episode', {
  data: function() {
    return {
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
    }
  },
  methods: {
    saveProgress() {
      // Only save position when video is loaded so a slow connection doesn't
      // erase the previous playback position.
      if (this.videoElement.readyState >= 3) {
        this.$store.dispatch('movies/setEpisodeProgress', {
          tmdbId: this.movie.tmdbId,
          episodeId: this.episode.id,
          progress: this.videoElement.currentTime,
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
  },
  mounted: function () {

    this.$store.dispatch('permissions/getPermissions').then(permissions => {
      this.canWatchMovies = permissions.includes('movies_watch');
      if(!this.canWatchMovies) {
        return;
      }
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
              this.videoElement = document.getElementById("video");
              this.videoElement.currentTime = this.episode.progress;
              this.progressInterval = setInterval(this.saveProgress, 3000);
            }
          });
        }
      );
    });
  },
  beforeDestroy: function () {
    clearInterval(this.progressInterval);
    this.saveProgress();
  },
  template: `
    <div v-if="episode && canWatchMovies" class="container">
      <h2>{{ fullTitle }}</h2>
      <video id="video" controls autoplay v-if="episode.isConverted" :key="this.episode.id">
        <source :src="episode.convertedVideoUrl" type="video/mp4">
        <track v-if="subtitlesExistEn" label="English" kind="captions" srclang="en" :src="episode.vttSubtitlesUrlEn" default>
        <track v-if="subtitlesExistFr" label="French" kind="captions" srclang="fr" :src="episode.vttSubtitlesUrlFr">
        <track v-if="subtitlesExistDe" label="German" kind="captions" srclang="de" :src="episode.vttSubtitlesUrlDe">
      </video>
      <div v-if="!episode.isConverted">This episode is not converted for web playback.</div>
      <div class="episode-actions">
        <div class="button-group horizontal">
          <a class="button" v-if="!episode.isWatched" v-on:click.prevent="markEpisodeAsWatched">
            <i class="far fa-check-circle"></i> Mark as seen
          </a>
          <a class="button" v-if="episode.isWatched" v-on:click.prevent="markEpisodeAsUnwatched">
            <i class="fas fa-check-circle"></i> Mark as not seen
          </a>
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