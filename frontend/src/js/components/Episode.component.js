const EpisodeComponent = Vue.component('episode', {
  data: function() {
    return {
      movie: null,
      episode: null,
      videoElement: null,
      progressInterval: null,
    }
  },
  computed: {
    fullTitle: function() {
      if (this.movie.mediaType === MediaType.MOVIE) {
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
  },
  methods: {
    saveProgress() {
      // Only save position when video is loaded so a slow connection doesn't
      // erase the previous playback position.
      if (this.videoElement.readyState >= 3) {
        this.$store.dispatch('setEpisodeProgress', {
          tmdbId: this.movie.tmdbId,
          episodeId: this.episode.id,
          progress: this.videoElement.currentTime,
        });
      }
    },
    markEpisodeAsWatched: function() {
      this.$store.dispatch('markEpisodeAsWatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
    markEpisodeAsUnwatched: function() {
      this.$store.dispatch('markEpisodeAsUnwatched', {
        tmdbId: this.movie.tmdbId,
        episodeId: this.episode.id,
      });
    },
  },
  mounted: function () {
    this.$store.dispatch('getMovie', this.$route.params.tmdbId).then(
      movie => {
        this.movie = movie;
        this.episode = this.movie.episodeMap[this.$route.params.episodeId];
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
  },
  beforeDestroy: function () {
    clearInterval(this.progressInterval);
    this.saveProgress();
  },
  template: `
    <div v-if="episode">
      <h2 class="container">{{ fullTitle }}</h2>
      <video id="video" controls autoplay v-if="episode.isConverted" :key="this.episode.id">
        <source :src="episode.convertedVideoUrl" type="video/mp4">
        <track label="English" kind="captions" srclang="en" :src="episode.vttSubtitlesUrlEn" default>
        <track label="French" kind="captions" srclang="fr" :src="episode.vttSubtitlesUrlFr">
        <track label="German" kind="captions" srclang="de" :src="episode.vttSubtitlesUrlDe">
      </video>
      <div v-if="!episode.isConverted">This episode is not converted for web playback.</div>
      <div class="container episode-actions">
        <div class="button-group horizontal">
          <a class="button" v-if="!episode.lastWatched" v-on:click.prevent="markEpisodeAsWatched">
            <i class="fas fa-eye"></i>
          </a>
          <a class="button" v-if="episode.lastWatched" v-on:click.prevent="markEpisodeAsUnwatched">
            <i class="fas fa-eye-slash"></i>
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