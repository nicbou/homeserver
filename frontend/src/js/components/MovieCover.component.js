const MovieCoverComponent = Vue.component('movie-cover', {
  props: ['movie'],
  data: function () {
    return {
      deleted: false,
      selectedSeason: null,
      selectedEpisode: null,
      WatchStatus: WatchStatus,
      MediaType: MediaType,
      showInfo: false,
    };
  },
  methods: {
    episodeDeleted: function(episode) {
      // Remove episode from movie's episodes
      const deletionIndex = this.movie.episodes.indexOf(episode);
      if (deletionIndex !== -1) {
        this.movie.episodes.splice(deletionIndex, 1);
      }

      if (episode === this.selectedEpisode) {
        this.selectedEpisode = null;
      }

      // Remove episode from selected season
      if (this.selectedSeason && this.selectedSeason.seasonNumber === episode.season) {
        const seasonDeletionIndex = this.selectedSeason.indexOf(episode);
        if (seasonDeletionIndex !== -1) {
          this.selectedSeason.splice(seasonDeletionIndex, 1);
        }

        if (this.selectedSeason.length === 0) {
          this.selectedSeason = null;
        }
      }

      if (this.movie.episodes.length == 0){
        this.deleted = true;
      }

      this.selectDefaultSeasonAndEpisode();
    },
    selectDefaultSeasonAndEpisode: function() {
      if (!this.hasEpisodes) {
        this.selectedEpisode = this.movie.episodes[0];
      }
      else if (!this.hasSeasons) {
        this.selectedSeason = this.seasons[0];
      }
    },
    scrollToTop: function() {
      this.$el.querySelector('.movie-info').scrollTop = 0;
    }
  },
  computed: {
    seasons: function() {
      return this.movie.episodes
        .reduce((seasons, episode) => {
          // episode.season can be null
          const seasonNumber = episode.season === null ? 1 : episode.season;
          seasons[seasonNumber - 1] = seasons[seasonNumber - 1] || []
          seasons[seasonNumber - 1].push(episode);
          seasons[seasonNumber - 1].seasonNumber = seasonNumber;
          return seasons;
        }, [])
        .filter(Boolean)
        .map((season) => {
          season.unseenEpisodeCount = () => {
            return season.filter(e => e.watchStatus !== WatchStatus.WATCHED).length
          }
          return season.sort((a, b) => { return a.episode - b.episode; });
        });
    },
    hasEpisodes: function() {
      return this.movie.episodes.length > 1;
    },
    hasSeasons: function() {
      return this.seasons.length > 1;
    },
    isMovie: function() {
      return this.movie.mediaType === MediaType.MOVIE;
    },
    isTVShow: function() {
      return this.movie.mediaType === MediaType.TV_SHOW;
    }
  },
  created: function() {
    this.selectDefaultSeasonAndEpisode();
  },
  template: `
    <div class="movie" :class="{ watched: movie.watched, deleted: deleted }">
      <span class="deleted-icon" v-if="deleted"></span>
      <img v-if="!deleted && movie.coverUrl && !showInfo" class="cover" :src="movie.coverUrl" v-on:click="showInfo=true">
      <div v-if="!deleted" class="movie-info">
        <h2>
          {{ movie.title }}
          <br><small>{{ movie.releaseYear }}</small>
        </h2>

        <!-- Season list -->
        <div v-if="!selectedSeason && !selectedEpisode" class="panel panel-default">
          <div v-if="hasEpisodes" class="panel-heading">
            <span v-if="hasSeasons">{{ seasons.length }} seasons, </span>
            {{ movie.episodes.length }} <span v-if="isMovie">parts</span><span v-if="isTVShow">episodes</span>
            <i v-if="movie.watched" class="glyphicon glyphicon-ok pull-right"></i>
          </div>
          <div class="panel-body">
            <div class="list-group">
              <button v-for="(season, index) in seasons" v-on:click="selectedSeason=season;scrollToTop()" class="list-group-item">
                Season {{ season.seasonNumber }}
                <i v-if="season.unseenEpisodeCount() == 0" class="glyphicon glyphicon-ok pull-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Episode/part list -->
        <div v-if="selectedSeason && !selectedEpisode" class="panel panel-default">
          <div class="panel-heading" v-if="isTVShow || hasSeasons">
            <i v-if="hasSeasons" class="glyphicon glyphicon-menu-left" v-on:click="selectedSeason=null;scrollToTop()"></i>
            Season {{ selectedSeason.seasonNumber }}
            <i v-if="selectedSeason.unseenEpisodeCount() == 0" class="glyphicon glyphicon-ok pull-right"></i>
          </div>
          <div class="panel-body">
            <div class="list-group">
              <button v-for="episode in selectedSeason" v-on:click="selectedEpisode=episode;scrollToTop()" class="list-group-item">
                <span v-if="isTVShow">Episode {{ episode.episode }}</span>
                <span v-if="isMovie">Part {{ episode.episode }}</span>
                <i v-if="episode.watchStatus == WatchStatus.WATCHED" class="glyphicon glyphicon-ok pull-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Individual episodes/parts -->
        <div v-if="selectedEpisode" class="panel panel-default">
          <div v-if="hasEpisodes || isTVShow" class="panel-heading">
            <i class="glyphicon glyphicon-menu-left" v-if="hasEpisodes" v-on:click="selectedEpisode=null;scrollToTop()"></i>
            <span v-if="isTVShow">Season {{ (selectedSeason || this.seasons[0]).seasonNumber }}, episode {{ selectedEpisode.episode }}</span>
            <span v-if="isMovie">Part {{ selectedEpisode.episode }}</span>
            <i v-if="selectedEpisode.watchStatus == WatchStatus.Watched" class="glyphicon glyphicon-ok pull-right"></i>
          </div>
          <div class="panel-body">
            <episode-actions :episode="selectedEpisode" v-on:episodeDeleted="episodeDeleted" :is-movie="isMovie" :is-only-episode="!hasEpisodes"></episode-actions>
          </div>
          </div>
          <p>{{ movie.description }}</p>
          <p v-if="movie.dateAdded && !movie.lastWatched" class="text-muted hidden-sm hidden-xs">Added {{ movie.dateAdded.fromNow() }}</p>
          <p v-if="movie.dateAdded && movie.lastWatched" class="text-muted hidden-sm hidden-xs">Added {{ movie.dateAdded.fromNow() }}, watched {{ movie.lastWatched.fromNow() }}</p>
          <p v-if="!movie.dateAdded && movie.lastWatched" class="text-muted hidden-sm hidden-xs">Watched {{ movie.lastWatched.fromNow() }}</p>
      </div>
    </div>
  `,
  components: [
    MovieActionsComponent,
  ]
});