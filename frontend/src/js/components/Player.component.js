const PlayerComponent = Vue.component('player', {
  props: ['movie', 'episode'],
  data: function() {
    return {
      videoElement: null,
      progressInterval: null,
    }
  },
  computed: {
    isConverted: function() {
      return this.episode.conversionStatus === ConversionStatus.CONVERTED
    },
    fullTitle: function() {
      return `${this.movie.title}, S${this.episode.season || '?'}E${this.episode.episode || '?'}`
    },
    episodeIndex: function() {
      return this.movie.episodes.indexOf(this.episode);
    },
    previousEpisode: function() {
      return this.movie.episodes[this.episodeIndex-1] || null;
    },
    nextEpisode: function() {
      return this.movie.episodes[this.episodeIndex+1] || null;
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
        this.episode.progress = this.videoElement.currentTime;
        MoviesService.setProgress(this.episode.id, this.videoElement.currentTime);
      }
    },
    close: function() {
      this.$router.push({ name: 'movies' });
    },
    markAsWatched: function() {
      MoviesService.markAsWatched(this.episode.id).then(() => {
        this.episode.lastWatched = moment();
      });
    },
    markAsUnwatched: function() {
      MoviesService.markAsUnwatched(this.episode.id).then(() => {
        this.episode.lastWatched = null;
      });
    },
  },
  mounted: function () {
    this.$nextTick(function () {
      // Save video position
      if (this.isConverted) {
        this.videoElement = document.getElementById("video");
        this.videoElement.currentTime = this.episode.progress;
        this.progressInterval = setInterval(this.saveProgress, 3000);
      }
    });
  },
  beforeDestroy: function () {
    clearInterval(this.progressInterval);
    this.saveProgress();
  },
  template: `
    <div class="text-center player" v-on:click.self="close">
      <video id="video" controls autoplay v-if="isConverted">
        <source :src="episode.convertedVideoUrl" type="video/mp4">
        <track label="English" kind="captions" srclang="en" :src="episode.vttSubtitlesUrl" default>
      </video>
      <div v-if="!isConverted" class="not-converted">This episode is not converted.</div>
      <div class="episode-controls">
        {{fullTitle}}
        <router-link v-if="nextEpisode" :to="{ name: 'movies', params: { episodeId: nextEpisode.id }}" class="pull-right"><span class="glyphicon glyphicon-step-forward"></span></router-link>
        <a href="#" v-if="!episode.lastWatched" v-on:click.prevent="markAsWatched()" class="pull-right">
          <span class="glyphicon glyphicon-eye-open"></span>
        </a>
        <a href="#" v-if="episode.lastWatched" v-on:click.prevent="markAsUnwatched()" class="pull-right">
          <span class="glyphicon glyphicon-eye-close"></span>
        </a>
        <chromecast-button v-if="isConverted && hasChromecastSupport" :episode="episode" class="pull-right">
          <img src="/images/chromecast-muted.svg" class="chromecast-icon"/>
        </chromecast-button>
        <router-link v-if="previousEpisode" :to="{ name: 'movies', params: { episodeId: previousEpisode.id }}" class="pull-right"><span class="glyphicon glyphicon-step-backward"></span></router-link>
      </div>
    </div>
  `,
  components: [
    AccountListItemComponent,
  ]
});