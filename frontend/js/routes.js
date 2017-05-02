const router = new VueRouter({
  routes: [
    { path: '/dashboard', name: 'dashboard', component: DashboardComponent },
    { path: '/movies', name: 'movies', component: MoviesComponent },
    { path: '/', redirect: { name: 'dashboard' }},
  ]
})