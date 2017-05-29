class AccountsService extends JsonService {
  getAccounts() {
    return new Promise((resolve, reject) => {
      this.getJson(API_URL + '/accounts').then(
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