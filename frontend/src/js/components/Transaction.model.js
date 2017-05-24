class Transaction {
  constructor(jsonResponse) {
    this.accountId = jsonResponse.accountId;
    this.accountDisplayName = jsonResponse.accountDisplayName;
    this.title = jsonResponse.title;
    this.description = jsonResponse.description;
    this.date = moment(new Date(jsonResponse.date));
    this.amount = jsonResponse.amount;
  }
}