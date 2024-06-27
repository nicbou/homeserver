import router from './routes.js';
import store from './store/store.js';

export const app = new Vue({
  el: '#page',
  data: {
    isAdmin: false,
    canManageMovies: false,
    canManageTorrents: false,
  },
  created: function(){
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.canManageMovies = userSettings.permissions.includes('movies_manage');
      this.canManageTorrents = userSettings.permissions.includes('torrents');
      this.isAdmin = userSettings.isAdmin;
    });
  },
  router,
  store,
});