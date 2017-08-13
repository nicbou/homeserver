class Account {
  constructor(jsonResponse) {
    this.name = jsonResponse.name;
    this.displayName = jsonResponse.displayName;
    this.isCredit = !!jsonResponse.isCredit;
    this.isActive = !!jsonResponse.isActive;
    this.balances = jsonResponse.balances;

    this.balances.forEach((balance) => {
      balance.date = moment(balance.date);
    })
  }

  get balance() {
    return this.balances[0] ? this.balances[0].balance : 0;
  } 

  balanceForDate(date) {
    const closestBalance = this.balances.find((balance) => {
      return balance.date.isSameOrBefore(date);
    });
    return closestBalance ? closestBalance.balance : 0;
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