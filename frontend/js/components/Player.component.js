const PlayerComponent = Vue.component('player', {
  props: ['part'],
  template: `
    <div class="text-center player">
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