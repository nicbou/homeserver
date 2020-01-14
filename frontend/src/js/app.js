const Api = new ApiService('/api/');

const app = new Vue({
  el: '#page',
  data: {
    canManageMovies: false,
    canManageTorrents: false,
  },
  created: function(){
    this.$store.dispatch('permissions/getPermissions').then(permissions => {
      this.canManageMovies = permissions.includes('movies_manage');
      this.canManageTorrents = permissions.includes('torrents');
    });
  },
  router,
  store,
});