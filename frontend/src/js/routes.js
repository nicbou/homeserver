import TorrentsComponent from './components/Torrents.component.js';
import TriageComponent from './components/Triage.component.js';
import MoviesComponent from './components/Movies.component.js';
import EpisodeComponent from './components/Episode.component.js';
import MovieComponent from './components/Movie.component.js';

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