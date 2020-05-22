import router from './routes.js';
import store from './store/store.js';

export const app = new Vue({
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