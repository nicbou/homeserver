const permissionsStore = {
  namespaced: true,
  state: {
    permissionsPromise: null,
  },
  mutations: {
    SET_PERMISSIONS_PROMISE(state, promise) {
      state.permissionsPromise = promise;
    },
  },
  actions: {
    async getPermissions(context) {
      if (context.state.permissionsPromise === null) {
        const permissionsPromise = fetch('/api/auth/info/')
          .then((response) => {
            return response.json().then(data => data.permissions);
          })
          .catch(err => []);
        context.commit('SET_PERMISSIONS_PROMISE', permissionsPromise);
      }
      return context.state.permissionsPromise;
    },
  },
};