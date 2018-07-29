function truncateDate(date) {
  return date.startOf('day');
}

class Account {
  constructor(jsonResponse) {
    this.name = jsonResponse.name;
    this.displayName = jsonResponse.displayName;
    this.isCredit = !!jsonResponse.isCredit;
    this.isActive = !!jsonResponse.isActive;

    // Create a date: balance map of all balances for quick access
    this.balances = jsonResponse.balances
      .map((jsonBalance) => {
        jsonBalance.date = moment(jsonBalance.date);
        return jsonBalance;
      })
      .reduce((balances, balance, index) => {
        // The balances are sorted from newest to oldest. This would fail otherwise.
        if (!balances.latest) {
          balances.latest = balance;
        }
        balances.oldest = balance

        const roundedDate = truncateDate(balance.date);
        if (!balances[roundedDate]) {
          balances[roundedDate] = balance;
        }
        return balances;
      }, {});

    // Fill missing days in the balance dictionary
    if (Object.keys(this.balances).length > 0) {
      const startDate = truncateDate(this.balances.oldest.date);
      const endDate = truncateDate(moment());
      const now = moment();
      let closestBalance = this.balances.oldest;
      for (let currentDate = startDate; currentDate.isBefore(now); currentDate.add(1, 'days')) {
        const currentDateKey = currentDate.toString();
        if (this.balances[currentDateKey]) {
          closestBalance = this.balances[currentDateKey];
        } else {
          this.balances[currentDateKey] = closestBalance
        }
      }
    }
  }

  get balance() {
    return this.balances.latest ? this.balances.latest.balance : 0;
  }

  balanceForDate(date) {
    const roundedDate = truncateDate(date).toString();
    return this.balances[roundedDate] ? this.balances[roundedDate].balance : 0;
  }

  variationBetweenDates(startDate, endDate=null) {
    endDate = endDate || moment();

    const startBalance = this.balanceForDate(startDate);
    const endBalance = this.balanceForDate(endDate);
    return endBalance - startBalance;
  }

  variationForNumberOfDays(days, endDate) {
    endDate = endDate || moment();
    const startDate = endDate.clone().subtract(days, 'days');
    return this.variationBetweenDates(startDate, endDate);
  }
}