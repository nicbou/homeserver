class SavingsTarget {
  constructor(accounts, targetAmount, startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate || moment();
    this.targetAmount = targetAmount;
    this.accounts = accounts;
  }

  balanceForDate(date) {
    return this.accounts
      .map(account => account.balanceForDate(date))
      .reduce((a,b) => a + b, 0);
  }

  get initialBalance() {
    return this.balanceForDate(this.startDate);
  }

  get amountToSavePerDay() {
    return this.targetAmount / this.duration;
  }

  targetForDate(date) {
    const daysElapsed = date.diff(this.startDate, 'days');
    return this.initialBalance + (this.amountToSavePerDay * daysElapsed);
  }

  get duration() { // in days
    return this.endDate.diff(this.startDate, 'days');
  }

  daysElapsed(date) {
    date = date || moment();
    return date.diff(this.startDate, 'days');
  }

  daysLeft(date) {
    date = date || moment();
    return this.duration - this.daysElapsed(date);
  }

  get currentBalance() {
    return this.balanceForDate(moment());
  }

  amountSaved(date) {
    date = date || moment();
    return this.balanceForDate(date) - this.initialBalance;
  }

  amountLeftToSave(date) {
    date = date || moment();
    return this.targetAmount - this.amountSaved(date);
  }

  isStarted(date) {
    date = date || moment();
    return this.startDate.isSameOrBefore(date);
  }

  isOnTrack(date) {
    date = date || moment();
    return this.balanceForDate(date) >= this.targetForDate(date);
  }

  variationDay(currentDate) {
    return this.accounts
      .map(account => account.variationForNumberOfDays(1, currentDate))
      .reduce((a,b) => a + b, 0);
  }

  variationWeek(currentDate) {
    return this.accounts
      .map(account => account.variationForNumberOfDays(7, currentDate))
      .reduce((a,b) => a + b, 0);
  }

  variationMonth(currentDate) {
    return this.accounts
      .map(account => account.variationForNumberOfDays(30, currentDate))
      .reduce((a,b) => a + b, 0);
  }

  variationYear(currentDate) {
    return this.accounts
      .map(account => account.variationForNumberOfDays(365, currentDate))
      .reduce((a,b) => a + b, 0);
  }
}