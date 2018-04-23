const ConversionStatus = {
  NOT_CONVERTED: 0,
  CONVERTING: 1,
  CONVERSION_FAILED: 2,
  CONVERTED: 3
};

const WatchStatus = {
  NOT_WATCHED: 0,
  WATCHING: 1,
  WATCHED: 2,
};

const MediaType = {
  TV_SHOW: 1,
  MOVIE: 2,
};

const movieSorter = (a, b) => {
  // New additions, old additions, watched a long time ago, watched recently
  if (a.lastWatched && b.lastWatched) {
    return a.lastWatched - b.lastWatched;
  } else if (a.lastWatched) {
    return 1;
  } else if (b.lastWatched) {
    return -1;
  } else {
    return b.dateAdded - a.dateAdded;
  }
};

const episodeSorter = (a, b) => {
  return a.season - b.season || a.episode - b.episode
};

class Movie {
  get watchStatus() {
    if (this.episodes.every(p => p.watchStatus === WatchStatus.WATCHED)) {
      return WatchStatus.WATCHED;
    } else if (this.episodes.some(p => p.watchStatus === WatchStatus.WATCHING)) {
      return WatchStatus.WATCHING;
    }
    return WatchStatus.NOT_WATCHED;
  }

  get watched() {
    return this.watchStatus === WatchStatus.WATCHED;
  }

  get lastWatched() {
    // Only returns a date when all episodes have been watched
    const lastWatchedDates = this.episodes.map(p => p.lastWatched).filter(Boolean);
    if (lastWatchedDates.length === this.episodes.length) {
      return moment.max(lastWatchedDates);
    }
    return null;
  }

  get conversionStatus() {
    if (this.episodes.every(p => p.conversionStatus === ConversionStatus.CONVERTED)) {
      return ConversionStatus.CONVERTED;
    } else if (this.episodes.some(p => p.conversionStatus === ConversionStatus.CONVERTING)) {
      return ConversionStatus.CONVERTING;
    } else if (this.episodes.some(p => p.conversionStatus === ConversionStatus.CONVERSION_FAILED)) {
      return ConversionStatus.CONVERSION_FAILED;
    }
    return ConversionStatus.NOT_CONVERTED;
  }

  get isConverted() {
    return this.conversionStatus === ConversionStatus.CONVERTED;
  }

  get nextEpisodeToPlay() {
    return this.episodes.find(p => p.conversionStatus === ConversionStatus.CONVERTED && p.watchStatus === WatchStatus.WATCHING)
      || this.episodes.find(p => p.conversionStatus === ConversionStatus.CONVERTED && p.watchStatus === WatchStatus.NOT_WATCHED)
      || this.episodes[0];
  }

  get releaseYear() {
    return this.episodes[0].releaseYear;
  }

  get dateAdded() {
    return moment.max(this.episodes.map(p => p.dateAdded));
  }

  get seasons() {
    return this.episodes
      .reduce((seasons, episode) => {
        // episode.season can be null
        const seasonNumber = episode.season === null ? 1 : episode.season;
        seasons[seasonNumber - 1] = seasons[seasonNumber - 1] || []
        seasons[seasonNumber - 1].push(episode);
        seasons[seasonNumber - 1].seasonNumber = seasonNumber;
        return seasons;
      }, [])
      .filter(Boolean)
      .map((season) => {
        season.unseenEpisodeCount = function () {
          return season.filter(e => e.watchStatus !== WatchStatus.WATCHED).length
        }
        return season;
      });
  }

  static fromMovieApiResponse(jsonResponse) {
    const movie = new Movie();
    movie.tmdbId = jsonResponse.tmdbId;
    movie.title = jsonResponse.title;
    movie.description = jsonResponse.description;
    movie.coverUrl = jsonResponse.coverUrl;
    movie.rating = jsonResponse.rating;
    movie.mediaType = jsonResponse.mediaType;
    movie.episodes = jsonResponse.episodes
      .map((episode) => {
        let episodeString = '';
        if (episode.episode) {
          if (episode.season) {
            episodeString = `S${episode.season}E${episode.episode}`;
          }
          else {
            episodeString = `Part ${episode.episode}`;
          }
        }

        return {
          id: episode.id,
          season: episode.season,
          episode: episode.episode,
          conversionStatus: episode.conversionStatus,
          lastWatched: episode.lastWatched ? moment(episode.lastWatched) : null,
          playbackUrl: `/player/play/${ episode.id }/`,
          convertedVideoUrl: episode.convertedVideoUrl,
          originalVideoUrl: episode.originalVideoUrl,
          vttSubtitlesUrl: episode.vttSubtitlesUrl,
          srtSubtitlesUrl: episode.srtSubtitlesUrl,
          releaseYear: episode.releaseYear,
          progress: episode.progress,
          dateAdded: moment(episode.dateAdded),
          episodeString: episodeString,
          get watchStatus() {
            if (this.progress > 0 && !this.lastWatched) {
              return WatchStatus.WATCHING;
            } else if (this.lastWatched) {
              return WatchStatus.WATCHED;
            }
            return WatchStatus.NOT_WATCHED;
          }
        }
      })
      .sort(episodeSorter);

    return movie;
  }

  static fromTMDBSearchResult(result) {
    const movie = new Movie();
    const coverRelativeUrl = result.poster_path || result.cover_path;
    const releaseDate = result.release_date || result.first_air_date;
    movie.tmdbId = result.id;
    movie.title = result.title || result.name;
    movie.description = result.overview;
    movie.coverUrl = coverRelativeUrl ? `https://image.tmdb.org/t/p/w500${coverRelativeUrl}` : null;
    movie.rating = null;
    movie.mediaType = result.media_type == 'tv' ? MediaType.TV_SHOW : MediaType.MOVIE;
    movie.episodes = [
      {
        id: null,
        season: null,
        episode: null,
        conversionStatus: null,
        lastWatched: null,
        playbackUrl: null,
        convertedVideoUrl: null,
        originalVideoUrl: null,
        vttSubtitlesUrl: null,
        srtSubtitlesUrl: null,
        releaseYear: releaseDate ? parseInt(releaseDate.substring(0,4)) : null,
        progress: 0,
        dateAdded: moment(),
        watchStatus: WatchStatus.NOT_WATCHED
      }
    ];
    return movie;
  }
}