function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
};

const TriageItemComponent = Vue.component('triage-item', {
  props: ['file', 'subtitles'],
  data: function() {
    return {
      convertToMp4: true,
      description: '',
      episode: null,
      highlightedSuggestion: null,
      query: '',
      saved: false,
      savingInProgress: false,
      season: null,
      selectedMovie: null,
      selectedSubtitles: null,
      suggestions: [],
      suggestionsVisible: false,
    }
  },
  computed: {
    sanitizedSeason: function() {
      return Math.abs(parseInt(this.season, 10)) || null;
    },
    sanitizedEpisode: function() {
      return Math.abs(parseInt(this.episode, 10)) || null;
    },
    fullTitle: function() {
      if (this.selectedMovie) {
        if (this.sanitizedEpisode) {
          return `${this.selectedMovie.title}, S${this.sanitizedSeason || '?'}E${this.sanitizedEpisode || '?'}`;
        }
        return this.selectedMovie.title;
      }
      return this.movieFile;
    },
    coverUrl: function() {
      if (this.selectedMovie) {
        return this.selectedMovie.coverUrl;
      }
      else if (this.highlightedSuggestion !== null) {
        return this.suggestions[this.highlightedSuggestion].coverUrl;
      }
      else {
        return null;
      }
    }
  },
  watch: {
    // whenever question changes, this function will run
    query: function (newQuery) {
      if (!this.selectedMovie) { // Saves a useless query
        this.getResults(newQuery);
      }
    },
    suggestions: function () {
      this.highlightedSuggestion = this.suggestions.length ? 0 : null;
    },
    sanitizedSeason: function (newSeason) {
      if (this.selectedMovie) {
        this.selectedMovie.episodes[0].season = newSeason;
      }
    },
    sanitizedEpisode: function (newEpisode) {
      if (this.selectedMovie) {
        this.selectedMovie.episodes[0].episode = newEpisode;
      }
    },
    selectedMovie: function () {
      this.selectedMovie.episodes[0].season = this.sanitizedSeason;
      this.selectedMovie.episodes[0].episode = this.sanitizedEpisode;
      this.query = this.selectedMovie.title;
      this.description = this.selectedMovie.description;
    },
    description: function () {
      if (this.selectedMovie) {
        this.selectedMovie.description = this.description;
      }
    }
  },
  methods: {
    getResults: debounce(function(query) {
      if (query) {
        TriageService.getSuggestions(query).then((results) => {
          this.suggestions = results.slice(0, 10);
        })
      }
    }, 500),
    focused: function() {
      this.highlightedSuggestion = this.suggestions.length ? 0 : null;
      this.suggestionsVisible = true;
    },
    blurred: function() {
      this.highlightedSuggestion = null;
      setTimeout(() => {
        this.suggestionsVisible = false;
      }, 200)
    },
    movieInputEnter: function() {
      if (this.highlightedSuggestion !== null) {
        this.selectedMovie = this.suggestions[this.highlightedSuggestion];
        document.getElementById(`${this._uid}-season`).focus();
      }
    },
    addToLibrary: function() {
      this.savingInProgress = true;
      MoviesService.save(
        this.selectedMovie, {
          movieFile: this.file, 
          subtitlesFile: this.selectedSubtitles || null, 
          convertToMp4: this.convertToMp4
        }).then(() => {
        this.savingInProgress = false;
        this.saved = true;
      })
    }
  },
  template: `
    <div class="triage" v-if="!saved">
      <div class="cover-wrapper" :class="{'no-cover': !coverUrl}">
        <img v-if="coverUrl" class="cover img-responsive" :src="coverUrl">
        <span class="no-cover-icon" v-if="!coverUrl"></span>
      </div>
      <div class="movie-info">
        <h2 v-if="selectedMovie" class="hidden-sm hidden-xs">
          {{ fullTitle }}
          <br><small>{{ selectedMovie.releaseYear }}</small>
        </h2>

        <h2 v-if="!selectedMovie" class="hidden-sm hidden-xs">
          {{ file }}
        </h2>

        <hr/>

        <div class="form-horizontal">
          <div class="form-group">
            <label :for="_uid + '-title'" class="control-label col-sm-2">Title</label>
            <div class="col-sm-10 col-md-8">
              <input v-model="query" :id="_uid + '-title'" type="text" class="form-control" :placeholder="'/'+file" :disabled="selectedMovie"
                  v-on:blur="blurred" 
                  v-on:focus="focused"
                  v-on:keyup.enter="movieInputEnter"
                  v-on:keyup.prevent.up="highlightedSuggestion = (highlightedSuggestion + suggestions.length - 1) % suggestions.length"
                  v-on:keyup.prevent.down="highlightedSuggestion = (highlightedSuggestion + 1) % suggestions.length">
              <ul v-if="suggestionsVisible && suggestions.length > 0" class="suggestions">
                  <li :class="{'highlighted': highlightedSuggestion===index}"
                      v-for="(suggestion, index) in suggestions"
                      v-on:click="selectedMovie = suggestion"
                      v-on:mouseenter="highlightedSuggestion = index">
                    <small class="text-muted pull-right">{{ suggestion.episodes[0].releaseYear }}</small>
                    {{ suggestion.title }}
                  </li>
              </ul>
            </div>
          </div>

          <div class="form-group">
            <div class="col-sm-10 col-lg-5 col-md-6 col-sm-offset-2">
              <div class="input-group">
                <label :for="_uid + '-season'" class="input-group-addon"><span class="visible-xs">S</span><span class="hidden-xs">Season</span></label>
                <input v-model="season" type="number" class="form-control" :id="_uid + '-season'">
                <label :for="_uid + '-episode'" class="input-group-addon"><span class="visible-xs">Ep</span><span class="hidden-xs">Episode</span></label>
                <input v-model="episode" type="number" class="form-control" :id="_uid + '-episode'">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label :for="_uid + '-description'" class="control-label col-sm-2">Plot</label>
            <div class="col-sm-10 col-md-8">
              <textarea v-model="description" class="form-control" :id="_uid + '-description'" placeholder="Enter something here..."></textarea>
            </div>
          </div>

          <div class="form-group">
            <label :for="_uid + '-subtitles'" class="control-label col-sm-2">Subtitles</label>
            <div class="col-sm-10 col-md-8">
              <select v-model="selectedSubtitles" class="form-control" :id="_uid + '-subtitles'">
                <option value="" selected>No subtitles file</option>
                <option disabled>-----</option>
                <option v-for="subtitle in subtitles">{{ subtitle }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label :for="_uid + '-convert'" class="control-label col-sm-2">Conversion</label>
            <div class="col-sm-10 checkbox">
              <label>
                <input v-model="convertToMp4" type="checkbox" :id="_uid + '-convert'"> Convert this movie to .mp4
              </label>
            </div>
          </div>

          <hr/>
          <div class="form-group">
            <div class="col-sm-10 col-sm-offset-2">
              <button class="btn btn-primary" v-on:click="addToLibrary" :disabled="!selectedMovie && !savingInProgress">
                <span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Add to library
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
});