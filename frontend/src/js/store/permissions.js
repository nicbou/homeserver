const permissionsStore = {
  namespaced: true,
  state: {
    permissions: {},
    permissionsRequestStatus: RequestStatus.NONE,
  },
  mutations: {
    SET_PERMISSIONS(state, permissions) {
      state.permissions = permissions;
    },
    PERMISSIONS_REQUEST_SUCCESS(state) {
      state.permissionsRequestStatus = RequestStatus.SUCCESS;
    },
    PERMISSIONS_REQUEST_PENDING(state) {
      state.permissionsRequestStatus = RequestStatus.PENDING;
    },
    PERMISSIONS_REQUEST_FAILURE(state) {
      state.permissionsRequestStatus = RequestStatus.FAILURE;
    },
  },
  actions: {
    async getPermissions(context) {
      if (context.state.permissionsRequestStatus !== RequestStatus.SUCCESS) {
        context.commit('PERMISSIONS_REQUEST_PENDING');
        return await Api.request.get('/auth/info/')
          .then(response => {
            context.commit('SET_PERMISSIONS', response.data);
            context.commit('PERMISSIONS_REQUEST_SUCCESS');
            return context.state.permissions;
          }) 
          .catch(err => {
            context.commit('SET_PERMISSIONS', {});
            context.commit('PERMISSIONS_REQUEST_FAILURE');
            return context.state.permissions;
          });
      }
      else {
        return context.state.permissions;
      }
    },
    async hasPermission(context, permission) {
      const userPermissions = await context.dispatch('getPermissions');
      return userPermissions.isAdmin || userPermissions.permissions.includes(permission);
    },
  },
};