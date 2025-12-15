export default {
  namespaced: true,
  state: {
    userSettingsPromise: null,
  },
  mutations: {
    SET_USERSETTINGS_PROMISE(state, promise) {
      state.userSettingsPromise = promise;
    },
  },
  actions: {
    async getUserSettings(context) {
      if (context.state.userSettingsPromise === null) {
        const userSettingsPromise = fetch('/auth/info/')
          .then(r => r.json())
          .catch(err => []);
        context.commit('SET_USERSETTINGS_PROMISE', userSettingsPromise);
      }
      return context.state.userSettingsPromise;
    },
  },
};