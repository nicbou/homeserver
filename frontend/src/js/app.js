const Api = new ApiService('/api/');

const app = new Vue({
  el: '#page',
  data: {
    canManageMovies: false,
    canManageTorrents: false,
  },
  created: function(){
    this.$store.dispatch('permissions/hasPermission', 'movies_manage').then(value => this.canManageMovies = value);
    this.$store.dispatch('permissions/hasPermission', 'torrents').then(value => this.canManageTorrents = value);
  },
  router,
  store,
});