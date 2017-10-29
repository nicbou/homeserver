const TriageComponent = Vue.component('triage', {
  data: function() {
    return {
      movieFiles: [],
      subtitleFiles: [],
    }
  },
  created: function () {
    TriageService.getFilesToTriage().then(
      (data) => {
        data.subtitles.sort();
        this.subtitleFiles = data.subtitles;
        this.movieFiles = data.movies;
      }
    )
  },
  template: `
    <div id="triage">
      <h2>Triage</h2>
      <triage-item v-for="movie in movieFiles" :key="movie" :file="movie" :subtitles="subtitleFiles"></triage-item>
    </div>
  `
});