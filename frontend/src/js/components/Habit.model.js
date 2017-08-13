class Habit {
  constructor(jsonResponse) {
    this.id = jsonResponse.id;
    this.displayName = jsonResponse.displayName;
    this.occurences = jsonResponse.occurences.map(o => moment(o));
    this.minimumSuccessfulDays = jsonResponse.minimumSuccessfulDays;
    this.daysPerPeriod = jsonResponse.daysPerPeriod;
  }

  _findOccurence(date) {
    date = date.startOf('day');
    return this.occurences.findIndex(o => date.isSame(o, 'day'));
  }

  isSuccessful() {
    const successfulDays = this.occurences.filter(o => this.isDateInPeriod(o));
    return successfulDays.length >= this.minimumSuccessfulDays;
  }

  toggleDate(date) {
    date = date.startOf('day');

    const occurenceIndex = this._findOccurence(date);
    if (occurenceIndex === -1) {
      this.occurences.push(date);
    } else {
      this.occurences.splice(occurenceIndex, 1);
    }

    return occurenceIndex > -1;
  }

  isSuccessfulForDate(date) {
    date = date.startOf('day');
    return this._findOccurence(date) > -1;
  }

  isDateInPeriod(date) {
    const firstDayInPeriod = moment().startOf('day').subtract(this.daysPerPeriod, 'days');
    return date.isSameOrAfter(firstDayInPeriod);
  }
}