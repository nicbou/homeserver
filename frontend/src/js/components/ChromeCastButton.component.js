const ChromeCastButtonComponent = Vue.component('chromecast-button', {
  props: ['episode'],
  methods: {
    play: function(episode, subtitlesLanguage='en') {
      const loadMedia = () => {
        // We request a token so that the ChromeCast can access the media file without
        // any authentication.
        fetch(`/api/movies/${this.episode.id}/token/`)
          .then(response => {
            return response.json().then(data => {
              const token = data.token;
              const mediaUrl = `${location.origin}${episode.convertedVideoUrl}?token=${token}`;

              const capitalizedLanguageCode = subtitlesLanguage.charAt(0).toUpperCase() + subtitlesLanguage.slice(1).toLowerCase();
              const subtitlesAttribute = `vttSubtitlesUrl${capitalizedLanguageCode}`;
              const subtitlesUrl = `${location.origin}${episode[subtitlesAttribute]}?token=${token}`;

              ChromeCast.setMedia(mediaUrl, subtitlesUrl, this.episode.progress || 0);
            })
          });
      }

      if(!ChromeCast.isConnectedToDevice()) {
        ChromeCast.selectDevice().then(loadMedia);
      } else {
        loadMedia();
      }
    }
  },
  template: `
    <a :href="episode.convertedVideoUrl" v-on:click.prevent="play(episode)" title="Send to ChromeCast" class="chromecast-button">
      <slot></slot>
    </a>
  `
});