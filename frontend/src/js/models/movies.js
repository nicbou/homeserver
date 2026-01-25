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

  get smallVideoUrl(){
    return this.largeVideoUrl.replace('.large.mp4', '.small.mp4');
  }

  subtitlesUrl(format, language){
    return this.largeVideoUrl.replace('.large.mp4', `.${language}.${format}`);
  }
}

export class Movie {
  get percentSeen(){
    if(this.episodeList.length === 1){
      return Math.round(this.episodeList[0].progress / this.episodeList[0].duration * 100);
    }
    return Math.round(this.episodeList.filter(e => e.isWatched).length / this.episodeList.length * 100);
  }

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
      .map(season => {
        season.unseenEpisodeCount = () => season.filter(e => e.watchStatus !== WatchStatus.WATCHED).length;
        return season;
      })
  }

  get episodeList() {
    return Object.values(this.episodeMap).sort(episodeSorter);
  }

  get hasLargeVersion() {
    return this.episodeList.some(e => e.hasLargeVersion);
  }
}