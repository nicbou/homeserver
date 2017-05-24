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

class Movie {
  constructor(jsonResponse) {
    this.imdbId = jsonResponse.imdbId;
    this.title = jsonResponse.title;
    this.description = jsonResponse.description;
    this.coverUrl = jsonResponse.coverUrl;
    this.rating = jsonResponse.rating;
    this.parts = jsonResponse.parts.map((part) => {
      return {
        id: part.id,
        partNumber: part.partNumber,
        conversionStatus: part.conversionStatus,
        lastWatched: part.lastWatched ? moment(part.lastWatched) : null,
        playbackUrl: `/player/play/${ part.id }/`,
        videoUrl: part.videoUrl,
        progress: part.progress,
        dateAdded: moment(part.dateAdded),
        get watchStatus() {
          if (this.progress > 0) {
            return WatchStatus.WATCHING;
          } else if (this.lastWatched) {
            return WatchStatus.WATCHED;
          }
          return WatchStatus.NOT_WATCHED;
        }
      }
    });

    this.parts.sort((a, b) => a.part - b.part);
  }

  get watchStatus() {
    if (this.parts.every(p => p.watchStatus === WatchStatus.WATCHED)) {
      return WatchStatus.WATCHED;
    } else if (this.parts.some(p => p.watchStatus === WatchStatus.WATCHING)) {
      return WatchStatus.WATCHING;
    }
    return WatchStatus.NOT_WATCHED;
  }

  get lastWatched() {
    // Only returns a date when all parts have been watched
    const lastWatchedDates = this.parts.map(p => p.lastWatched).filter(Boolean);
    if (lastWatchedDates.length === this.parts.length) {
      return moment.max(lastWatchedDates);
    }
    return null;
  }

  get conversionStatus() {
    if (this.parts.every(p => p.conversionStatus === ConversionStatus.CONVERTED)) {
      return ConversionStatus.CONVERTED;
    } else if (this.parts.some(p => p.conversionStatus === ConversionStatus.CONVERTING)) {
      return ConversionStatus.CONVERTING;
    } else if (this.parts.some(p => p.conversionStatus === ConversionStatus.CONVERSION_FAILED)) {
      return ConversionStatus.CONVERSION_FAILED;
    }
    return ConversionStatus.NOT_CONVERTED;
  }

  get isConverted() {
    return this.conversionStatus === ConversionStatus.CONVERTED;
  }

  get nextPartToPlay() {
    return this.parts.find(p => p.conversionStatus === ConversionStatus.CONVERTED && p.watchStatus === WatchStatus.WATCHING)
      || this.parts.find(p => p.conversionStatus === ConversionStatus.CONVERTED && p.watchStatus === WatchStatus.NOT_WATCHED)
      || this.parts[0];
  }

  get releaseYear() {
    return this.parts[0].releaseYear;
  }

  get dateAdded() {
    return moment.max(this.parts.map(p => p.dateAdded));
  }
}

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
}