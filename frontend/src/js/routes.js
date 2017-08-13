const router = new VueRouter({
  routes: [
    { path: '/login', name: 'login', component: LoginComponent },
    { path: '/dashboard', name: 'dashboard', component: DashboardComponent },
    { path: '/movies/:partId?', name: 'movies', component: MoviesComponent },
    { path: '/', redirect: { name: 'dashboard' }},
  ]
})

// Enforce authentication
router.beforeEach((to, from, next) => {
  Api.checkAuthentication()
    .then(() => {
      if (to.name === 'login') {
        next({ path: from.path }); // Already logged in
      } else {
        next();
      }
    })
    .catch(() => {
      if (to.name === 'login') {
        next(); // Prevents a redirect loop
      } else {
        next({ name: 'login', query: { next: from.path }});
      }
    });
});