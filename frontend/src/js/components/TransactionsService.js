class TransactionsService {
  static getTransactions() {
    return Api.request.get('/transactions')
      .then((response) => {
        const transactions = response.data.transactions.map((transaction) => new Transaction(transaction));
        resolve(transactions);
      });
  }
}