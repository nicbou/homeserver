class AccountsService {
  static getAccounts() {
    return Api.request.get('/accounts').then((response) => {
      return response.data.accounts.map((account) => new Account(account));
    });
  }
}