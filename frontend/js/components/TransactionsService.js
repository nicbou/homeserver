class TransactionsService extends JsonService {
  getTransactions() {
    return new Promise((resolve, reject) => {
      this.getJson('http://home.nicolasbouliane.com/status/transactions').then(
        (responseJson) => {
          const transactions = responseJson.transactions.map((transaction) => new Transaction(transaction));
          resolve(transactions);
        },
        (responseJson) => {
          reject(responseJson)
        }
      );
    });
  }
}