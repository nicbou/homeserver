export const ConversionStatus = {
  NOT_CONVERTED: 0,
  CONVERTING: 1,
  CONVERTED: 3
};

export const WatchStatus = {
  NOT_WATCHED: 0,
  WATCHING: 1,
  WATCHED: 2,
};

export const MediaType = {
  TV_SHOW: 1,
  MOVIE: 2,
};

export const movieSorter = (a, b) => {
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

export const episodeSorter = (a, b) => {
  return a.season - b.season || a.episode - b.episode;
};

export class Episode {
  get episodeString() {
    if (this.episode) {
      if (this.season) {
        return `S${this.season}E${this.episode}`;
      }
      return `Part ${this.episode}`;
    }
    return '';
  }

  get watchStatus() {
    if (this.progress > 0 && !this.lastWatched) {
      return WatchStatus.WATCHING;
    } else if (this.lastWatched) {
      return WatchStatus.WATCHED;
    }
    return WatchStatus.NOT_WATCHED;
  }

  get isWatched() {
    return this.watchStatus === WatchStatus.WATCHED;
  }

  get isWatching() {
    return this.watchStatus === WatchStatus.WATCHING;
  }

  get isConverting() {
    return this.conversionStatus === ConversionStatus.CONVERTING;
  }

  get isConverted() {
    return this.conversionStatus === ConversionStatus.CONVERTED;
  }

  get playbackUrl() {
    return `/player/play/${ this.id }/`;
  }

  get needsCleaning() {
    return this.isWatched && this.originalVideoPreserved;
  }
}

export class Movie {
  get watchStatus() {
    const episodeList = this.episodeList;
    if (episodeList.every(p => p.watchStatus === WatchStatus.WATCHED)) {
      return WatchStatus.WATCHED;
    } else if (episodeList.some(p => p.watchStatus === WatchStatus.WATCHING)) {
      return WatchStatus.WATCHING;
    }
    return WatchStatus.NOT_WATCHED;
  }

  get isWatched() {
    return this.watchStatus === WatchStatus.WATCHED;
  }

  get lastWatched() {
    // Only returns a date when all episodes have been watched
    const episodeList = this.episodeList;
    const lastWatchedDates = episodeList.map(p => p.lastWatched).filter(Boolean);
    if (lastWatchedDates.length === episodeList.length) {
      return moment.max(lastWatchedDates);
    }
    return null;
  }

  get conversionStatus() {
    const episodeList = this.episodeList;
    if (episodeList.every(p => p.conversionStatus === ConversionStatus.CONVERTED)) {
      return ConversionStatus.CONVERTED;
    } else if (episodeList.some(p => p.conversionStatus === ConversionStatus.CONVERTING)) {
      return ConversionStatus.CONVERTING;
    }
    return ConversionStatus.NOT_CONVERTED;
  }

  get nextEpisodeToPlay() {
    const episodeList = this.episodeList;
    return episodeList.find(p => p.isConverted && p.isWatching)
      || episodeList.find(p => p.isConverted && !p.isWatched && !p.isWatching)
      || episodeList.find(p => p.isConverted) || null;
  }

  get releaseYear() {
    return this.episodeList[0].releaseYear;
  }

  get dateAdded() {
    return moment.max(this.episodeList.map(p => p.dateAdded));
  }

  get seasons() {
    return Object.values(this.episodeList)
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
      })
  }

  get episodeList() {
    return Object.values(this.episodeMap).sort(episodeSorter);
  }

  get needsCleaning() {
    return this.episodeList.some(e => e.needsCleaning);
  }

  static fromMovieApiResponse(jsonResponse) {
    const movie = new Movie();
    movie.isStarred = !!jsonResponse.isStarred;
    movie.tmdbId = jsonResponse.tmdbId;
    movie.title = jsonResponse.title;
    movie.description = jsonResponse.description;
    movie.coverUrl = jsonResponse.coverUrl;
    movie.mediaType = jsonResponse.mediaType;
    movie.episodeMap = jsonResponse.episodes
      .reduce(
        (episodes, jsonEpisode) => {
          const episode = new Episode();
          episode.id = jsonEpisode.id;
          episode.season = jsonEpisode.season;
          episode.episode = jsonEpisode.episode;
          episode.conversionStatus = jsonEpisode.conversionStatus;
          episode.lastWatched = jsonEpisode.lastWatched ? moment(jsonEpisode.lastWatched) : null;
          episode.convertedVideoUrl = jsonEpisode.convertedVideoUrl;
          episode.originalVideoUrl = jsonEpisode.originalVideoUrl;
          episode.vttSubtitlesUrlEn = jsonEpisode.vttSubtitlesUrlEn;
          episode.vttSubtitlesUrlDe = jsonEpisode.vttSubtitlesUrlDe;
          episode.vttSubtitlesUrlFr = jsonEpisode.vttSubtitlesUrlFr;
          episode.srtSubtitlesUrlEn = jsonEpisode.srtSubtitlesUrlEn;
          episode.srtSubtitlesUrlDe = jsonEpisode.srtSubtitlesUrlDe;
          episode.srtSubtitlesUrlFr = jsonEpisode.srtSubtitlesUrlFr;
          episode.releaseYear = jsonEpisode.releaseYear;
          episode.progress = jsonEpisode.progress;
          episode.dateAdded = moment(jsonEpisode.dateAdded);
          episode.originalVideoPreserved = jsonEpisode.originalVideoPreserved;
          episodes[episode.id] = episode;
          return episodes
        },
      {});

    return movie;
  }

  static fromTMDBSearchResult(result) {
    const coverRelativeUrl = result.poster_path || result.cover_path;
    const releaseDate = result.release_date || result.first_air_date;

    const episode = new Episode();
    episode.id = null;
    episode.season = null;
    episode.episode = null;
    episode.conversionStatus = ConversionStatus.NOT_CONVERTED;
    episode.lastWatched = null;
    episode.convertedVideoUrl = null;
    episode.originalVideoUrl = null;
    episode.vttSubtitlesUrlEn = null;
    episode.vttSubtitlesUrlDe = null;
    episode.vttSubtitlesUrlFr = null;
    episode.srtSubtitlesUrlEn = null;
    episode.srtSubtitlesUrlDe = null;
    episode.srtSubtitlesUrlFr = null;
    episode.releaseYear = releaseDate ? parseInt(releaseDate.substring(0,4)) : null;
    episode.progress = 0;
    episode.dateAdded = moment();

    const movie = new Movie();
    movie.tmdbId = result.id;
    movie.title = result.title || result.name;
    movie.description = result.overview;
    movie.coverUrl = coverRelativeUrl ? `https://image.tmdb.org/t/p/w500${coverRelativeUrl}` : null;
    movie.mediaType = result.media_type == 'tv' ? MediaType.TV_SHOW : MediaType.MOVIE;
    movie.episodeMap = {[episode.id]: episode};
    return movie;
  }
}