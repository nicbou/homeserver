class AccountsService {
  static getAccounts(daysToFetch=30) {
    const params = {'params': {'days': daysToFetch}}
    return Api.request.get('/accounts', params).then((response) => {
      return response.data.accounts.map((account) => new Account(account));
    });
  }
}