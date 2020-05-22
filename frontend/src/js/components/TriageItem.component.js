function debounce(func, wait, immediate) {
    let timeout;
    return function() {
      let context = this, args = arguments;
      let later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      let callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
};

import MoviesService from './MoviesService.js';
import TriageService from './TriageService.js';

export default Vue.component('triage-item', {
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
      selectedSubtitlesEn: null,
      selectedSubtitlesDe: null,
      selectedSubtitlesFr: null,
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
      return null;
    }
  },
  watch: {
    file: function (newFile) {
      const seasonRegex = /S([0-9]+)/i;
      const episodeRegex = /[0-9 \.]E([0-9]+)/i;
      const episodeMatch = newFile.match(episodeRegex);

      if (episodeMatch) {
        this.episode = Number(episodeMatch[1]);
        if (seasonMatch) {
          this.season = Number(seasonMatch[1]);
        }
      }
    },
    query: function (newQuery) {
      this.getResults(newQuery);
    },
    suggestions: function () {
      this.highlightedSuggestion = this.suggestions.length ? 0 : null;
    },
    sanitizedSeason: function (newSeason) {
      if (this.selectedMovie) {
        this.selectedMovie.episodeList[0].season = newSeason;
      }
    },
    sanitizedEpisode: function (newEpisode) {
      if (this.selectedMovie) {
        this.selectedMovie.episodeList[0].episode = newEpisode;
      }
    },
    selectedMovie: function () {
      if (this.selectedMovie) {
        this.selectedMovie.episodeList[0].season = this.sanitizedSeason;
        this.selectedMovie.episodeList[0].episode = this.sanitizedEpisode;
        this.query = this.selectedMovie.title;
        this.description = this.selectedMovie.description;
      } else {
        this.query = '';
        this.description = '';
      }
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
          subtitlesFileEn: this.selectedSubtitlesEn || null, 
          subtitlesFileDe: this.selectedSubtitlesDe || null, 
          subtitlesFileFr: this.selectedSubtitlesFr || null, 
          convertToMp4: this.convertToMp4
        }
      ).then(() => {
        this.savingInProgress = false;
        this.saved = true;
        this.$store.dispatch('movies/getMovies', true);
      })
    }
  },
  template: `
    <div class="tab-body section movie-info" v-if="!saved">
      <div class="cover">
        <img v-if="coverUrl" :src="coverUrl">
        <div v-if="!coverUrl" class="placeholder"></div>
      </div>
      <div class="information">
        <div class="form">
          <div class="control">
            <label :for="_uid + '-title'">Title</label>
            <input
              autocomplete="off"
              class="input"
              type="text"
              v-model="query"
              :id="_uid + '-title'"
              :placeholder="'/'+file"
              @blur="blurred" 
              @focus="focused"
              @keyup.enter="movieInputEnter"
              @keyup.prevent.up="highlightedSuggestion = (highlightedSuggestion + suggestions.length - 1) % suggestions.length"
              @keyup.prevent.down="highlightedSuggestion = (highlightedSuggestion + 1) % suggestions.length">
            <ul v-if="suggestionsVisible && suggestions.length > 0" class="suggestions">
              <li
                :class="{'highlighted': highlightedSuggestion===index}"
                v-for="(suggestion, index) in suggestions"
                @click="selectedMovie = suggestion"
                @mouseenter="highlightedSuggestion = index">
                <small>{{ suggestion.episodeList[0].releaseYear }}</small>
                {{ suggestion.title }}
              </li>
            </ul>
          </div>

          <div class="control">
            <label class="label" :for="_uid + '-season'">Season</label>
            <input class="input" v-model="season" type="number" autocomplete="off" :id="_uid + '-season'"/>
          </div>

          <div class="control">
            <label class="label" :for="_uid + '-episode'">Episode</label>
            <input class="input" v-model="episode" type="number" autocomplete="off" :id="_uid + '-episode'"/>
          </div>

          <div class="control">
            <label class="label" :for="_uid + '-description'">Plot</label>
            <textarea class="input" v-model="description" :id="_uid + '-description'" placeholder="Enter something here..."></textarea>
          </div>

          <div class="control">
            <label :for="_uid + '-subtitles-en'">English subs</label>
            <select class="input" v-model="selectedSubtitlesEn" :id="_uid + '-subtitles-en'">
              <option value="" selected>No subtitles file</option>
              <option disabled>-----</option>
              <option v-for="subtitle in subtitles">{{ subtitle }}</option>
            </select>
          </div>

          <div class="control">
            <label :for="_uid + '-subtitles-fr'">French subs</label>
            <select class="input" v-model="selectedSubtitlesFr" :id="_uid + '-subtitles-fr'">
              <option value="" selected>No subtitles file</option>
              <option disabled>-----</option>
              <option v-for="subtitle in subtitles">{{ subtitle }}</option>
            </select>
          </div>

          <div class="control">
            <label :for="_uid + '-subtitles-de'">German subs</label>
            <select class="input" v-model="selectedSubtitlesDe" :id="_uid + '-subtitles-de'">
              <option value="" selected>No subtitles file</option>
              <option disabled>-----</option>
              <option v-for="subtitle in subtitles">{{ subtitle }}</option>
            </select>
          </div>

          <div class="control">
            <label :for="_uid + '-convert'">Conversion</label>
            <label class="input checkbox">
              <input v-model="convertToMp4" type="checkbox" :id="_uid + '-convert'"> Convert this movie to .mp4
            </label>
          </div>

          <div class="button-group horizontal">
            <button class="button main" @click="addToLibrary" :disabled="!selectedMovie && !savingInProgress">
              Add to library
            </button>
            <button class="button" @click="selectedMovie = null; highlightedSuggestion = null;" :disabled="!selectedMovie">
              Clear form
            </button>
          </div>
        </div>
      </div>
    </div>
  `
});