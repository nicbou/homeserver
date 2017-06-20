class TransactionsService {
  static getTransactions() {
    return Api.request.get('/transactions')
      .then((response) => {
        return response.data.transactions.map((transaction) => new Transaction(transaction));
      });
  }
}