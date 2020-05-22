import TorrentsComponent from './components/torrents.js';
import TriageComponent from './components/triage.js';
import MoviesComponent from './components/movies.js';
import EpisodeComponent from './components/episode.js';
import MovieComponent from './components/movie.js';

export default new VueRouter({
  routes: [
    { path: '/torrents', name: 'torrents', component: TorrentsComponent },
    { path: '/triage', name: 'triage', component: TriageComponent },
    { path: '/movies', name: 'movies', component: MoviesComponent },
    { path: '/movies/:tmdbId/:episodeId', name: 'episode', component: EpisodeComponent },
    { path: '/movies/:tmdbId', name: 'movie', component: MovieComponent },
    { path: '/', redirect: { name: 'movies' }},
  ]
});