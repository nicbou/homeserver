const router = new VueRouter({
  routes: [
    { path: '/dashboard', name: 'dashboard', component: DashboardComponent },
    { path: '/torrents', name: 'torrents', component: TorrentsComponent },
    { path: '/triage', name: 'triage', component: TriageComponent },
    { path: '/movies/:episodeId?', name: 'movies', component: MoviesComponent },
    { path: '/games/snes/:episodeId?', name: 'games-snes', component: SnesComponent },
    { path: '/', redirect: { name: 'movies' }},
  ]
})