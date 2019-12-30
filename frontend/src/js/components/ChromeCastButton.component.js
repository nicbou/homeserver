const ChromeCastButtonComponent = Vue.component('chromecast-button', {
  props: ['episode'],
  methods: {
    play: function(episode, subtitlesLanguage='en') {
      const loadMedia = () => {
        // We request a token so that the ChromeCast can access the media file without
        // any authentication.
        return Api.request.get(`/movies/${this.episode.id}/token/`).then((response) => {
          const token = response.data.token;
          const mediaUrl = `${location.origin}${episode.convertedVideoUrl}?token=${token}`;

          const capitalizedLanguageCode = subtitlesLanguage.charAt(0).toUpperCase() + subtitlesLanguage.slice(1).toLowerCase();
          const subtitlesAttribute = `vttSubtitlesUrl${capitalizedLanguageCode}`;
          const subtitlesUrl = `${location.origin}${episode[subtitlesAttribute]}?token=${token}`;

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
        this.$store.dispatch('setEpisodeProgress', {
          tmdbId: this.movie.tmdbId,
          episodeId: this.episode.id,
          progress: this.videoElement.currentTime,
        });
      }
    }
  },
  template: `
    <a :href="episode.convertedVideoUrl" v-on:click.prevent="play(episode)" title="Send to ChromeCast" class="chromecast-button">
      <slot></slot>
    </a>
  `
});