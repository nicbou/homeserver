const PlayerComponent = Vue.component('player', {
  props: ['episode'],
  data: function() {
    return {
      videoElement: null,
      progressInterval: null,
    }
  },
  methods: {
    saveProgress() {
      this.episode.progress = this.videoElement.currentTime;
      MoviesService.setProgress(this.episode.id, this.videoElement.currentTime);
    },
    close: function() {
      this.$router.push({ name: 'movies' });
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      this.videoElement = document.getElementById("video");
      this.videoElement.currentTime = this.episode.progress;
      this.progressInterval = setInterval(this.saveProgress, 3000);
    });
  },
  beforeDestroy: function () {
    clearInterval(this.progressInterval);
    this.videoElement.currentTime = this.episode.progress;
    this.saveProgress();
  },
  template: `
    <div class="text-center player" v-on:click.self="close">
      <video id="video" controls autoplay>
        <source :src="episode.convertedVideoUrl" type="video/mp4">
        <track label="English" kind="captions" srclang="en" :src="episode.vttSubtitlesUrl" default>
      </video>
    </div>
  `,
  components: [
    AccountListItemComponent,
  ]
});