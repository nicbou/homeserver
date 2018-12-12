const ChromeCastButtonComponent = Vue.component('chromecast-button', {
  props: ['episode'],
  methods: {
    play: function(episode) {
      const loadMedia = () => {
        // We request a token so that the ChromeCast can access the media file without
        // any authentication.
        return Api.request.get(`/movies/${this.episode.id}/token/`).then((response) => {
          const token = response.data.token;
          const mediaUrl = `${location.origin}${episode.convertedVideoUrl}?token=${token}`;
          const subtitlesUrl = `${location.origin}${episode.vttSubtitlesUrl}?token=${token}`;
          ChromeCast.setMedia(mediaUrl, subtitlesUrl);
        })
      }

      if(!ChromeCast.isConnectedToDevice()) {
        ChromeCast.selectDevice().then(loadMedia);
      } else {
        loadMedia();
      }

      // Set the playback time to 1 second, so that the movie shows in unfinished movies
      if (episode.progress === 0) {
        episode.progress = 1;
        MoviesService.setProgress(episode.id, episode.progress);
      }
    }
  },
  template: `
    <a :href="episode.convertedVideoUrl" v-on:click.prevent="play(episode)" title="Send to ChromeCast" class="chromecast-button">
      <slot></slot>
    </a>
  `
});