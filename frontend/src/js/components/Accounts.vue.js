if (document.querySelector('#finances')) {
  new Vue({
    el: '#finances',
    data: {
      accounts: [],
      transactions: [],
      selectedDate: moment()
    },
    computed: {
      savingsTarget: function() {
        return new SavingsTarget(
          this.accounts,
          7500,
          moment(new Date(2016, 3, 20)), // 0-based month
          moment(new Date(2017, 3, 20))
        );
      },
      selectedDateIsToday: function() {
        return this.selectedDate.isSame(moment(), 'day');
      }
    },
    methods: {
      dateSelected: function(date) {
        this.selectedDate = date;
      }
    },
    created: function () {
      const accountsService = new AccountsService();
      accountsService.getAccounts().then(
        (accounts) => {
          this.accounts = accounts;
        },
        () => {
          this.accounts = [];
        }
      )

      const transactionsService = new TransactionsService();
      transactionsService.getTransactions().then(
        (transactions) => {
          this.transactions = transactions;
        },
        () => {
          this.transactions = [];
        }
      )
    }
  });
}