import router from './routes.js';
import store from './store/store.js';

export const app = new Vue({
  el: '#page',
  data: {
    isAdmin: false,
  },
  async created(){
    this.isAdmin = (await this.$store.dispatch('users/getUserSettings')).isAdmin;
  },
  router,
  store,
});