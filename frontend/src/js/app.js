const Api = new ApiService('/api/');
const Permissions = new PermissionsService('/auth/info/');

const app = new Vue({
  el: '#page',
  data: {
    canManageMovies: false,
    canManageTorrents: false,
  },
  created: function(){
    Permissions.checkPermission('movies_manage').then(value => { this.canManageMovies = value; });
    Permissions.checkPermission('torrents').then(value => { this.canManageTorrents = value; });
  },
  router,
  store,
});