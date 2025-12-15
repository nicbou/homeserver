import MoviesService from './../services/movies-service.js';
import TriageService from './../services/triage-service.js';

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

export default Vue.component('triage-item', {
  props: ['file', 'subtitles'],
  data(){
    return {
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
    sanitizedSeason(){
      return Math.abs(parseInt(this.season, 10)) || null;
    },
    sanitizedEpisode(){
      return Math.abs(parseInt(this.episode, 10)) || null;
    },
    richFilename(){
      const faded = '<span class="faded">$&</span>';
      const parts = this.file.split('/').filter(Boolean);
      const path = '<span class="faded">' + parts.slice(0, -1).join('/') + '</span>';
      let filename = parts.at(-1);

      // Non-title words
      [
        '1080p',
        '10bit',
        '5.1',
        '720p',
        'ac3',
        'amzn',
        'bluray',
        'brrip',
        'ddp5.1',
        'dts',
        'eng',
        'esubs',
        'etrg',
        'galaxyrg',
        'galaxyrg265',
        'galaxytv',
        'hdrip',
        'h264',
        'hevc',
        'hulu',
        'multisub',
        'webrip',
        'web-dl',
        'x264',
        'x265',
      ].forEach(
        (word) => filename = filename.replace(new RegExp('\\b'+word+'\\b', 'gi'), faded)
      );

      // Samples
      ['sample'].forEach(
        (word) => filename = filename.replace(new RegExp('\\b'+word+'\\b', 'gi'), '<span class="error">$&</span>')
      );

      // Stuff in square brackets
      filename = filename.replace(/\[[^\]]+\]/ig, faded);

      // Extension
      filename = filename.replace(/\.[a-z0-9]{2,4}$/, faded);

      filename = filename.replaceAll('.', faded);

      return `${path}<br><strong>${filename}</strong>`;
    },
    fullTitle(){
      if (this.selectedMovie) {
        if (this.sanitizedEpisode) {
          return `${this.selectedMovie.title}, S${this.sanitizedSeason || '?'}E${this.sanitizedEpisode || '?'}`;
        }
        return this.selectedMovie.title;
      }
      return this.movieFile;
    },
    coverUrl(){
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
    file: {
      immediate: true,
      handler(newFile) {
        const seasonRegex = /S([0-9]+)/i;
        const seasonMatch = newFile.match(seasonRegex);
        const episodeRegex = /[0-9 \.]E([0-9]+)/i;
        const episodeMatch = newFile.match(episodeRegex);

        if (episodeMatch) {
          this.episode = Number(episodeMatch[1]);
          if (seasonMatch) {
            this.season = Number(seasonMatch[1]);
          }
        }
      },
    },
    query(newQuery) {
      this.getResults(newQuery);
    },
    suggestions(){
      this.highlightedSuggestion = this.suggestions.length ? 0 : null;
    },
    sanitizedSeason(newSeason) {
      if (this.selectedMovie) {
        this.selectedMovie.episodeList[0].season = newSeason;
      }
    },
    sanitizedEpisode(newEpisode) {
      if (this.selectedMovie) {
        this.selectedMovie.episodeList[0].episode = newEpisode;
      }
    },
    selectedMovie(){
      if (this.selectedMovie) {
        this.selectedMovie.episodeList[0].season = this.sanitizedSeason;
        this.selectedMovie.episodeList[0].episode = this.sanitizedEpisode;
        this.query = this.selectedMovie.title;
        this.description = this.selectedMovie.description;
        this.$store.dispatch('triage/addMovieSuggestion', this.selectedMovie);
      } else {
        this.query = '';
        this.description = '';
      }
    },
    description(){
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
      } else {
        this.suggestions = Array.from(this.$store.state.triage.recentMovieSuggestions);
      }
    }, 500),
    focused(){
      this.highlightedSuggestion = this.suggestions.length ? 0 : null;
      this.suggestionsVisible = true;
      if(!this.query && !this.suggestions.length){
        this.getResults(this.query);
      }
    },
    blurred(){
      this.highlightedSuggestion = null;
      setTimeout(() => {
        this.suggestionsVisible = false;
      }, 200)
    },
    movieInputEnter(){
      if (this.highlightedSuggestion !== null) {
        this.selectedMovie = this.suggestions[this.highlightedSuggestion];
        document.getElementById(`${this._uid}-season`).focus();
      }
    },
    async addToLibrary(){
      this.savingInProgress = true;
      await MoviesService.save(
        this.selectedMovie,
        {
          movieFile: this.file, 
          subtitlesFileEn: this.selectedSubtitlesEn || null, 
          subtitlesFileDe: this.selectedSubtitlesDe || null, 
          subtitlesFileFr: this.selectedSubtitlesFr || null, 
        }
      )
      this.savingInProgress = false;
      this.saved = true;
      this.$store.dispatch('movies/getMovies', true);
    }
  },
  template: `
    <div class="tab-body section movie-info triage" v-if="!saved">
      <div class="cover">
        <img v-if="coverUrl" :src="coverUrl">
        <div v-if="!coverUrl" class="placeholder"></div>
      </div>
      <div class="information">
        <div class="form">
          <div class="control">
            <span class="input filename" v-html="richFilename"></span>
          </div>
          <div class="control">
            <label :for="_uid + '-title'">Title</label>
            <input
              autocomplete="off"
              class="input"
              type="search"
              v-model="query"
              :id="_uid + '-title'"
              :placeholder="queryFromFilename"
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

          <div class="button-group horizontal">
            <button class="button main" @click="addToLibrary" :disabled="!selectedMovie || savingInProgress">
              <i class="fa fa-spinner fa-spin" v-if="savingInProgress"></i> Add to library
            </button>
            <button class="button" @click="selectedMovie = null; highlightedSuggestion = null;" :disabled="!selectedMovie || savingInProgress">
              Clear form
            </button>
          </div>
        </div>
      </div>
    </div>
  `
});