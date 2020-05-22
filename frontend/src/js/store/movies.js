import MoviesService from './../components/MoviesService.js';
import { RequestStatus } from './../models/requests.js';

export default {
  namespaced: true,
  state: {
    movies: {},
    moviesRequestStatus: RequestStatus.NONE,
    moviesRequestPromise: null,
  },
  mutations: {
    SET_MOVIES(state, movies) {
      state.movies = movies.reduce(
        (moviesObject, movie) => {
          moviesObject[movie.tmdbId] = movie;
          return moviesObject;
        },
        {}
      );
    },
    DELETE_EPISODE(state, {tmdbId, episodeId}) {
      Vue.delete(state.movies[tmdbId].episodeMap, episodeId);
      if(state.movies[tmdbId].episodeList.length === 0) {
        Vue.delete(state.movies, tmdbId);
      }
    },
    MARK_EPISODE_WATCHED(state, {tmdbId, episodeId}) {
      state.movies[tmdbId].episodeMap[episodeId].lastWatched = new Date();
    },
    MARK_EPISODE_UNWATCHED(state, {tmdbId, episodeId}) {
      state.movies[tmdbId].episodeMap[episodeId].lastWatched = null;
    },
    SET_EPISODE_PROGRESS(state, {tmdbId, episodeId, progress}) {
      state.movies[tmdbId].episodeMap[episodeId].progress = progress;
    },
    SET_MOVIES_REQUEST_PROMISE(state, promise) {
      state.moviesRequestPromise = promise;
    },
    MOVIES_REQUEST_SUCCESS(state) {
      state.moviesRequestStatus = RequestStatus.SUCCESS;
    },
    MOVIES_REQUEST_PENDING(state) {
      state.moviesRequestStatus = RequestStatus.PENDING;
    },
    MOVIES_REQUEST_FAILURE(state) {
      state.moviesRequestStatus = RequestStatus.FAILURE;
    },
  },
  actions: {
    async getMovies(context, forceRefresh = false) {
      if (context.state.moviesRequestStatus === RequestStatus.NONE || forceRefresh) {
        context.commit('MOVIES_REQUEST_PENDING');
        const moviesRequestPromise = MoviesService.getMovies()
          .then(movies => {
            context.commit('SET_MOVIES', movies);
            context.commit('MOVIES_REQUEST_SUCCESS');
            return context.state.movies;
          })
          .catch(err => {
            context.commit('SET_MOVIES', {});
            context.commit('MOVIES_REQUEST_FAILURE');
            return context.state.movies;
          });
        context.commit('SET_MOVIES_REQUEST_PROMISE', moviesRequestPromise);
        return moviesRequestPromise;
      }
      return context.state.moviesRequestPromise;
    },
    async getMovie(context, tmdbId) {
      const movies = await context.dispatch('getMovies');
      return movies[tmdbId];
    },
    async deleteEpisode(context, {tmdbId, episodeId}) {
      context.commit('DELETE_EPISODE', {tmdbId, episodeId});
      return await MoviesService.delete(episodeId);
    },
    async setEpisodeProgress(context, {tmdbId, episodeId, progress}) {
      context.commit('SET_EPISODE_PROGRESS', {tmdbId, episodeId, progress});
      return await MoviesService.setProgress(episodeId, progress);
    },
    async markEpisodeAsWatched(context, {tmdbId, episodeId}) {
      context.commit('MARK_EPISODE_WATCHED', {tmdbId, episodeId});
      return await MoviesService.markAsWatched(episodeId);
    },
    async markEpisodeAsUnwatched(context, {tmdbId, episodeId}) {
      context.commit('MARK_EPISODE_UNWATCHED', {tmdbId, episodeId});
      return await MoviesService.markAsUnwatched(episodeId);
    },
  }
};