const store = new Vuex.Store({
  modules: {
    permissions: permissionsStore,
    movies: moviesStore,
  },
  state: {
    currentPage: 0,
    currentQuery: '',
  },
  mutations: {
    SET_CURRENT_PAGE(state, page) {
      state.currentPage = page;
    },
    SET_CURRENT_QUERY(state, query) {
      state.currentQuery = query.trim().toLocaleLowerCase();
    },
  },
  actions: {
    setCurrentQuery(context, query) {
      context.commit('SET_CURRENT_PAGE', 0);
      context.commit('SET_CURRENT_QUERY', query);
    }
  }
});