const RequestStatus = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
}

const store = new Vuex.Store({
  state: {
    currentPage: 0,
    currentQuery: '',
    movies: {},
    moviesRequestStatus: RequestStatus.NONE,
    permissions: {},
    permissionsRequestStatus: RequestStatus.NONE,
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
    SET_PERMISSIONS(state, permissions) {
      state.permissions = permissions;
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
    MOVIES_REQUEST_SUCCESS(state) {
      state.moviesRequestStatus = RequestStatus.SUCCESS;
    },
    MOVIES_REQUEST_PENDING(state) {
      state.moviesRequestStatus = RequestStatus.PENDING;
    },
    MOVIES_REQUEST_FAILURE(state) {
      state.moviesRequestStatus = RequestStatus.FAILURE;
    },
    PERMISSIONS_REQUEST_SUCCESS(state) {
      state.permissionsRequestStatus = RequestStatus.SUCCESS;
    },
    PERMISSIONS_REQUEST_PENDING(state) {
      state.permissionsRequestStatus = RequestStatus.PENDING;
    },
    PERMISSIONS_REQUEST_FAILURE(state) {
      state.permissionsRequestStatus = RequestStatus.FAILURE;
    },
    SET_CURRENT_PAGE(state, page) {
      state.currentPage = page;
    },
    SET_CURRENT_QUERY(state, query) {
      state.currentQuery = query.trim().toLocaleLowerCase();
    },
  },
  actions: {
    async getMovies(context) {
      if (context.state.moviesRequestStatus !== RequestStatus.SUCCESS) {
        context.commit('MOVIES_REQUEST_PENDING');
        return await MoviesService.getMovies()
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
      }
      else {
        return context.state.movies;
      }
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
    async getPermissions(context) {
      if (context.state.permissionsRequestStatus !== RequestStatus.SUCCESS) {
        context.commit('PERMISSIONS_REQUEST_PENDING');
        return await PermissionsService.getPermissions()
          .then(permissions => {
            context.commit('SET_PERMISSIONS', permissions);
            context.commit('PERMISSIONS_REQUEST_SUCCESS');
            return context.state.permissions;
          })
          .catch(err => {
            context.commit('SET_PERMISSIONS', {});
            context.commit('PERMISSIONS_REQUEST_FAILURE');
            return context.state.permissions;
          });
      }
      else {
        return context.state.permissions;
      }
    },
    async hasPermission(context, permission) {
      const userPermissions = await context.dispatch('getPermissions');
      return userPermissions.isAdmin || userPermissions.permissions.includes(permission);
    },
    setCurrentQuery(context, query) {
      context.commit('SET_CURRENT_PAGE', 0);
      context.commit('SET_CURRENT_QUERY', query);
    }
  }
});