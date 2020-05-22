import TriageService from './../services/triage-service.js';
import SpinnerComponent from './spinner.js';

export default Vue.component('triage', {
  data: function() {
    return {
      movieFiles: [],
      subtitleFiles: [],
      loading: true,
    }
  },
  created: function () {
    TriageService.getFilesToTriage().then(
      (data) => {
        data.subtitles.sort();
        this.subtitleFiles = data.subtitles;
        this.movieFiles = data.movies;
        this.loading = false;
      }
    )
  },
  template: `
    <div id="triage" class="container">
      <h2>Triage</h2>
      <spinner v-if="loading"></spinner>
      <p v-if="!loading && movieFiles.length === 0">There are no movies in triage</p>
      <triage-item v-for="movie in movieFiles" :key="movie" :file="movie" :subtitles="subtitleFiles"></triage-item>
    </div>
  `
});