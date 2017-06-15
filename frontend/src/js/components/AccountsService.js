class AccountsService {
  static getAccounts() {
    return Api.request.get('/accounts').then((response) => {
      const accounts = response.data.accounts.map((account) => new Account(account));
      resolve(accounts);
    });
  }
}