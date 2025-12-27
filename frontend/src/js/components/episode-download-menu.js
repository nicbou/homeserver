import MoviesService from './../services/movies-service.js';

export default Vue.component('download-menu', {
  props: ['episode', 'movie'],
  data(){
    return {
      subtitlesExistEn: false,
      subtitlesExistFr: false,
      subtitlesExistDe: false,
    };
  },
  async mounted(){
    MoviesService.subtitlesExist(this.episode).then(availableSubtitles => {
      this.subtitlesExistEn = availableSubtitles.en;
      this.subtitlesExistFr = availableSubtitles.fr;
      this.subtitlesExistDe = availableSubtitles.de;
    })
  },
  template: `
    <div>
      <a class="button" :href="episode.originalVideoUrl" download>
        <i class="fas fa-film"></i> <span>Download original video</span>
      </a>
      <a class="button" :href="episode.convertedVideoUrl" download v-if="episode.isConverted">
        <i class="fas fa-film"></i> <span>Download converted video</span>
      </a>
      <a class="button" :href="episode.subtitlesUrl('srt', 'eng')" download v-if="subtitlesExistEn">
        <i class="far fa-closed-captioning"></i> <span>Download English subtitles</span>
      </a>
      <a class="button" :href="episode.subtitlesUrl('srt', 'fre')" download v-if="subtitlesExistFr">
        <i class="far fa-closed-captioning"></i> <span>Download French subtitles</span>
      </a>
      <a class="button" :href="episode.subtitlesUrl('srt', 'ger')" download v-if="subtitlesExistDe">
        <i class="far fa-closed-captioning"></i> <span>Download German subtitles</span>
      </a>
    </div>
  `
});