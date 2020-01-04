const EpisodeDownloadMenuComponent = Vue.component('download-menu', {
  props: ['episode', 'movie'],
  data: function() {
    return {
      subtitlesExistEn: false,
      subtitlesExistFr: false,
      subtitlesExistDe: false,
    };
  },
  mounted: function() {
    MoviesService.subtitlesExist(this.episode).then(
      availableSubtitles => {
        this.subtitlesExistEn = availableSubtitles.en;
        this.subtitlesExistFr = availableSubtitles.fr;
        this.subtitlesExistDe = availableSubtitles.de;
      }
    )
  },
  template: `
    <div>
      <a class="button" :href="episode.originalVideoUrl">
        <i class="fas fa-film"></i> <span>Download original video</span>
      </a>
      <a class="button" :href="episode.convertedVideoUrl">
        <i class="fas fa-film"></i> <span>Download converted video</span>
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlEn" v-if="subtitlesExistEn">
        <i class="far fa-closed-captioning"></i> <span>Download English subtitles</span>
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlFr" v-if="subtitlesExistFr">
        <i class="far fa-closed-captioning"></i> <span>Download French subtitles</span>
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlDe" v-if="subtitlesExistDe">
        <i class="far fa-closed-captioning"></i> <span>Download German subtitles</span>
      </a>
    </div>
  `
});