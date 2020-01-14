const Api = new ApiService('/api/');
const Permissions = new PermissionsService('/auth/info/');

const app = new Vue({
  el: '#page',
  data: {
    canManageMovies: false,
    canManageTorrents: false,
  },
  created: function(){
    this.$store.dispatch('hasPermission', 'movies_manage').then(value => this.canManageMovies = value);
    this.$store.dispatch('hasPermission', 'torrents').then(value => this.canManageTorrents = value);
  },
  router,
  store,
});