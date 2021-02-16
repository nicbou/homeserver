import router from './routes.js';
import store from './store/store.js';

export const app = new Vue({
  el: '#page',
  data: {
    canManageMovies: false,
    canManageTorrents: false,
  },
  created: function(){
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.canManageMovies = userSettings.permissions.includes('movies_manage');
      this.canManageTorrents = userSettings.permissions.includes('torrents');
    });
  },
  router,
  store,
});