const Api = new ApiService('/api/');
const Permissions = new PermissionsService('/auth/info/');

const app = new Vue({
  el: '#page',
  data: {
    canManageMovies: false,
    canManageTorrents: false,
    canSeeFinances: false,
    canSeeHabits: false,
  },
  created: function(){
    Permissions.checkPermission('movies_manage').then(value => { this.canManageMovies = value; });
    Permissions.checkPermission('torrents').then(value => { this.canManageTorrents = value; });
    Permissions.checkPermission('finances').then(value => { this.canSeeFinances = value; });
    Permissions.checkPermission('habits').then(value => { this.canSeeHabits = value; });
  },
  router,
  store,
});