const MovieCoverComponent = Vue.component('movie-cover', {
  props: ['movie'],
  data: function () {
    return {
      deleted: false,
      selectedSeason: null,
      selectedEpisode: null,
      WatchStatus: WatchStatus,
      showInfo: false,
    };
  },
  methods: {
    episodeDeleted: function() {
      const deletedIndex = this.movie.episodes.indexOf(episodeDeleted);
      this.movie.episodes.splice(deletedIndex, 1);
      if (this.movie.episodes.length == 0){
        this.deleted = true;
      }
    },
  },
  computed: {
    seasons: function() {
      return this.movie.episodes
        .reduce((seasons, episode) => {
          seasons[episode.season - 1] = seasons[episode.season - 1] || []
          seasons[episode.season - 1].push(episode);
          seasons[episode.season - 1].seasonNumber = episode.season
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
  },
  created: function() {
    if (!this.hasEpisodes) {
      this.selectedEpisode = this.movie.episodes[0];
    }
    else if (!this.hasSeasons) {
      this.selectedSeason = this.seasons[0];
    }
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
        <div v-if="!selectedSeason && !selectedEpisode" class="panel panel-default">
          <div v-if="hasEpisodes" class="panel-heading">
            <span v-if="hasSeasons">{{ seasons.length }} seasons, </span>{{ movie.episodes.length }} episodes
            <i v-if="movie.watched" class="glyphicon glyphicon-ok pull-right"></i>
          </div>
          <div class="panel-body">
            <div class="list-group">
              <button v-for="(season, index) in seasons" v-on:click="selectedSeason=season" class="list-group-item">
                Season {{ season.seasonNumber }}
                <i v-if="season.unseenEpisodeCount() == 0" class="glyphicon glyphicon-ok pull-right"></i>
              </button>
            </div>
          </div>
        </div>
        <div v-if="selectedSeason && !selectedEpisode" class="panel panel-default">
          <div class="panel-heading">
            <i v-if="hasSeasons" class="glyphicon glyphicon-menu-left" v-on:click="selectedSeason=null"></i>
            Season {{ selectedSeason.seasonNumber }}
            <i v-if="selectedSeason.unseenEpisodeCount() == 0" class="glyphicon glyphicon-ok pull-right"></i>
          </div>
          <div class="panel-body">
            <div class="list-group">
              <button v-for="episode in selectedSeason" v-on:click="selectedEpisode=episode" class="list-group-item">
                Episode {{ episode.episode }}
                <i v-if="episode.watchStatus == WatchStatus.WATCHED" class="glyphicon glyphicon-ok pull-right"></i>
              </button>
            </div>
          </div>
        </div>
        <div v-if="selectedEpisode" class="panel panel-default">
          <div v-if="hasEpisodes" class="panel-heading">
            <i class="glyphicon glyphicon-menu-left" v-on:click="selectedEpisode=null"></i>
            Season {{ selectedSeason.seasonNumber }}, episode {{ selectedEpisode.episode }}
            <i v-if="selectedEpisode.watchStatus == WatchStatus.Watched" class="glyphicon glyphicon-ok pull-right"></i>
          </div>
          <div class="panel-body">
            <episode-actions :episode="selectedEpisode" v-on:episodeDeleted="episodeDeleted"></episode-actions>
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