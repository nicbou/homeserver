const PlayerComponent = Vue.component('player', {
  props: ['episode'],
  methods: {
    close: function() {
      this.$router.push({ name: 'movies' });
    }
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