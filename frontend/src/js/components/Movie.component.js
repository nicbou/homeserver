const MovieComponent = Vue.component('movie', {
  data: function() {
    return {
      movie: null,
      currentSeason: null,
    }
  },
  mounted: function () {
    MoviesService.getMovies().then((movies) => {
      this.movie = movies.find(m => m.tmdbId === this.$route.params.tmdbId);
      this.currentSeason = this.movie.seasons.find(s => s.seasonNumber === this.movie.nextEpisodeToPlay.season) || this.movie.seasons[0];
    })
  },
  computed: {
    nextEpisodeName: function () {
      const nextEpisode = this.movie.nextEpisodeToPlay;
      return `S${nextEpisode.season}E${nextEpisode.episode}`
    }
  },
  methods: {
    playEpisode: function(episode) {
      this.$router.push({
        name: 'episode',
        params: {
          tmdbId: this.movie.tmdbId,
          episodeId: episode.id,
        },
      });
    },
  },
  template: `
    <div v-if="movie" class="container">
      <div class="section movie-info">
        <img class="cover" :src="movie.coverUrl" :key="movie.tmdbId"/>
        <div class="information">
          <div class="section description">
            <h2>{{ movie.title }}</h2>
            <p>{{ movie.description }}</p>
            <div class="button-group">
              <a @click="playEpisode(movie.nextEpisodeToPlay)" class="button large main">
                <i class="fas fa-play"></i>
                <span v-if="this.movie.episodes.length === 1">Play</span>
                <span v-if="this.movie.episodes.length > 1">Play {{ nextEpisodeName }}</span>
              </a>
              <chromecast-button :episode="movie.nextEpisodeToPlay" class="button large">
                <i class="fab fa-chromecast"></i>
                <span>Cast</span>
              </chromecast-button>
            </div>
          </div>
          <div class="section episodes" v-if="this.movie.episodes.length > 1">
            <div class="tab-group">
              <h3 class="title">Season</h3>
              <span
                @click="currentSeason = season"
                :class="{ selected: currentSeason.seasonNumber === season.seasonNumber }" class="tab"
                v-for="season in movie.seasons">
                {{ season.seasonNumber }}
              </span>
            </div>
            <div class="tab-body">
              <div class="episode" v-for="episode in currentSeason" :key="episode.id">
                <span class="title" @click="playEpisode(episode)">Episode {{ episode.episode }}</span>
                <episode-actions :movie="movie" :episode="episode"></episode-actions>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
});