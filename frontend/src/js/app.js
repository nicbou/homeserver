import router from './routes.js';
import store from './store/store.js';

export const app = new Vue({
  el: '#page',
  data: {
    isAdmin: false,
  },
  created: function(){
    this.$store.dispatch('users/getUserSettings').then(userSettings => {
      this.isAdmin = userSettings.isAdmin;
    });
  },
  router,
  store,
});