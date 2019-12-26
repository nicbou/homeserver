const router = new VueRouter({
  routes: [
    { path: '/dashboard', name: 'dashboard', component: DashboardComponent },
    { path: '/torrents', name: 'torrents', component: TorrentsComponent },
    { path: '/triage', name: 'triage', component: TriageComponent },
    { path: '/movies', name: 'movies', component: MoviesComponent },
    { path: '/movies/:tmdbId/:episodeId', name: 'episode', component: EpisodeComponent },
    { path: '/movies/:tmdbId', name: 'movie', component: MovieComponent },
    { path: '/', redirect: { name: 'movies' }},
  ]
});