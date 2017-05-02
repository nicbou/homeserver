class AccountsService extends JsonService {
  getAccounts() {
    return new Promise((resolve, reject) => {
      this.getJson('http://home.nicolasbouliane.com/status/accounts').then(
        (responseJson) => {
          const accounts = responseJson.accounts.map((account) => new Account(account));
          resolve(accounts);
        },
        (responseJson) => {
          reject(responseJson)
        }
      );
    });
  }
}