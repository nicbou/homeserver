import TriageService from './../services/triage-service.js';
import StatsService from './../services/stats-service.js';
import TriageItemComponent from './../components/triage-item.js';
import SpinnerComponent from './spinner.js';

export default Vue.component('triage', {
  data(){
    return {
      movieFiles: [],
      subtitleFiles: [],
      diskSpace: null,
      loading: true,
    }
  },
  async created(){
    const [data, diskSpace] = await Promise.all([
      TriageService.getFilesToTriage(),
      StatsService.getDiskSpace(),
    ]);
    this.subtitleFiles = data.subtitles;
    this.movieFiles = data.movies;
    this.diskSpace = diskSpace;
    this.loading = false;
  },
  methods: {
    bytesToGigabytes(bytes) {
      return (bytes / (1024 ** 3)).toFixed(1);
    },
  },
  template: `
    <div id="triage" class="container">
      <h2>Triage</h2>
      <spinner v-if="loading"></spinner>
      <p v-if="!loading && movieFiles.length === 0">There are no movies in triage</p>
      <triage-item v-for="movie in movieFiles" :key="movie" :file="movie" :subtitles="subtitleFiles"></triage-item>
      <p v-if="diskSpace" class="disk-space">{{ bytesToGigabytes(diskSpace.free) }} GB free of {{ bytesToGigabytes(diskSpace.total) }} GB</p>
    </div>
  `
});