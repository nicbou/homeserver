import userSettingsStore from './users.js';
import moviesStore from './movies.js';
import triageStore from './triage.js';

export default new Vuex.Store({
  modules: {
    users: userSettingsStore,
    movies: moviesStore,
    triage: triageStore,
  },
});