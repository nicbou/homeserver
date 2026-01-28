import { MediaType } from './../models/movies.js';

export default Vue.component('admin-menu', {
  props: ['episode', 'movie'],
  data(){
    return {
      canDelete: true,
    }
  },
  computed: {
    isTvShow(){
      return this.movie.mediaType === MediaType.TV_SHOW;
    },
  },
  methods: {
    deleteEpisode(episode) {
      this.$store.dispatch('movies/deleteEpisode', {
        tmdbId: this.movie.tmdbId,
        episodeId: episode.id,
      });
      this.postDelete();
      this.canDelete = false;
    },
    deleteSeason(){
      this.movie.episodeList.filter(ep => ep.season === this.episode.season).forEach(this.deleteEpisode);
    },
    deleteAllEpisodes(){
      this.movie.episodeList.forEach(this.deleteEpisode);
    },
    deleteOriginalVideo(episode) {
      this.movie.episodeList.filter(e => e.hasOriginalVersion && (!episode || e.id === episode.id)).forEach(episode => {
        this.$store.dispatch('movies/deleteOriginalVideo', {
          tmdbId: movie.tmdbId,
          episodeId: episode.id,
        });
      });
    },
    postDelete(){
      if(this.movie.episodeList.length === 0){
        this.$router.push({ name: 'movies' });
      }
    }
  },
  template: `
    <div>
      <button class="button" v-if="canDelete && episode" @click="deleteEpisode(episode)"><i class="fas fa-trash-alt"></i> Delete this episode</button>
      <button class="button" v-if="canDelete && episode" @click="deleteSeason"><i class="fas fa-trash-alt"></i> Delete this season</button>
      <button class="button" v-if="canDelete && (!episode || episode.hasOriginalVersion)" @click="deleteOriginalVideo(episode)"><i class="fas fa-trash-alt"></i> Delete original, keep converted version</button>
      <button class="button" v-if="canDelete && isTvShow" @click="deleteAllEpisodes"><i class="fas fa-trash-alt"></i> Delete all episodes</button>
      <button class="button" v-if="canDelete && !isTvShow" @click="deleteAllEpisodes"><i class="fas fa-trash-alt"></i> Delete this movie</button>
    </div>
  `
});
