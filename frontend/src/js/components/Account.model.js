class Account {
  constructor(jsonResponse) {
    this.name = jsonResponse.name;
    this.displayName = jsonResponse.displayName;
    this.isCredit = !!jsonResponse.isCredit;
    this.isActive = !!jsonResponse.isActive;
    this.balances = jsonResponse.balances
      .map((jsonBalance) => {
        jsonBalance.date = moment(jsonBalance.date);
        return jsonBalance;
      })
      .reduce((balances, balance, index) => {
        // The balances are sorted from newest to oldest. This would fail otherwise.
        if (!balances['current']) {
          balances['current'] = balance;
        }

        const roundedDate = balance.date.startOf('day').toString();
        if (!balances[roundedDate]) {
          console.log(roundedDate, balance)
          balances[roundedDate] = balance;
        }
        return balances;
      }, {});
  }

  get balance() {
    return this.balances['current'] ? this.balances['current'].balance : 0;
  } 

  balanceForDate(date) {
    const roundedDate = date.startOf('day').toString()
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