const PlayerComponent = Vue.component('player', {
  props: ['part'],
  methods: {
    close: function() {
      this.$router.push({ name: 'movies' });
    }
  },
  template: `
    <div class="text-center player" v-on:click.self="close">
      <video id="video" controls autoplay>
        <source :src="part.videoUrl" type="video/mp4">
        <track label="English" kind="captions" srclang="en" :src="part.subtitlesUrl" default>
      </video>
    </div>
  `,
  components: [
    AccountListItemComponent,
  ]
});