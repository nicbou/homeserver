import userSettingsStore from './users.js';
import moviesStore from './movies.js';

export default new Vuex.Store({
  modules: {
    users: userSettingsStore,
    movies: moviesStore,
  },
});