import permissionsStore from './permissions.js';
import moviesStore from './movies.js';

export default new Vuex.Store({
  modules: {
    permissions: permissionsStore,
    movies: moviesStore,
  },
});