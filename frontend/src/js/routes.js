const router = new VueRouter({
  routes: [
    { path: '/torrents', name: 'torrents', component: TorrentsComponent },
    { path: '/triage', name: 'triage', component: TriageComponent },
    { path: '/movies', name: 'movies', component: MoviesComponent },
    { path: '/movies/p:page', name: 'movies_page', component: MoviesComponent },
    { path: '/movies/:tmdbId/:episodeId', name: 'episode', component: EpisodeComponent },
    { path: '/movies/:tmdbId', name: 'movie', component: MovieComponent },
    { path: '/', redirect: { name: 'movies' }},
  ]
});