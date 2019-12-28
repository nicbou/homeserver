const EpisodeDownloadMenuComponent = Vue.component('download-menu', {
  props: ['episode', 'movie'],
  template: `
    <div>
      <a class="button" :href="episode.originalVideoUrl">
        <i class="fas fa-film"></i> <span>Download original video</span>
      </a>
      <a class="button" :href="episode.convertedVideoUrl">
        <i class="fas fa-film"></i> <span>Download converted video</span>
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlEn">
        <i class="far fa-closed-captioning"></i> <span>Download English subtitles</span>
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlFr">
        <i class="far fa-closed-captioning"></i> <span>Download French subtitles</span>
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlDe">
        <i class="far fa-closed-captioning"></i> <span>Download German subtitles</span>
      </a>
    </div>
  `
});