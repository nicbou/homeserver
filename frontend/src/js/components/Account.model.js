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
        if (index === 0) {
          balances['current'] = balance;
        }
        balances[balance.date.startOf('day').toISOString()] = balance;
        return balances;
      }, {});
  }

  get balance() {
    return this.balances['current'] ? this.balances['current'].balance : 0;
  } 

  balanceForDate(date) {
    const roundedDate = date.startOf('day').toISOString()
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