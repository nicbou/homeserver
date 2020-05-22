import MoviesService from './../services/movies-service.js';

export default Vue.component('download-menu', {
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
      <a class="button" :href="episode.originalVideoUrl" download>
        <i class="fas fa-film"></i> <span>Download original video</span>
      </a>
      <a class="button" :href="episode.convertedVideoUrl" download>
        <i class="fas fa-film"></i> <span>Download converted video</span>
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlEn" download v-if="subtitlesExistEn">
        <i class="far fa-closed-captioning"></i> <span>Download English subtitles</span>
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlFr" download v-if="subtitlesExistFr">
        <i class="far fa-closed-captioning"></i> <span>Download French subtitles</span>
      </a>
      <a class="button" :href="episode.srtSubtitlesUrlDe" download v-if="subtitlesExistDe">
        <i class="far fa-closed-captioning"></i> <span>Download German subtitles</span>
      </a>
    </div>
  `
});