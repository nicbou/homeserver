export default {
  namespaced: true,
  state: {
    recentMovieSuggestions: new Set(),
  },
  mutations: {
    ADD_MOVIE_SUGGESTION(state, suggestion) {
      state.recentMovieSuggestions.add(suggestion);
    },
  },
  actions: {
    addMovieSuggestion(context, suggestion) {
      context.commit('ADD_MOVIE_SUGGESTION', suggestion);
    },
  },
};