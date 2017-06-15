const FinancesPanelComponent = Vue.component('finances-panel', {
  data: function() {
    return {
      accounts: [],
      transactions: [],
      selectedDate: moment(),
    }
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
    AccountsService.getAccounts().then(
      (accounts) => {
        this.accounts = accounts;
      },
      () => {
        this.accounts = [];
      }
    )

    TransactionsService.getTransactions().then(
      (transactions) => {
        this.transactions = transactions;
      },
      () => {
        this.transactions = [];
      }
    )
  },
  template: `
    <div id="finances" class="panel panel-finances"
        :class="{
            'panel-default': accounts.length === 0 || savingsTarget.isOnTrack(selectedDate),
            'panel-danger': accounts.length > 0 && !savingsTarget.isOnTrack(selectedDate)
        }">
      <div class="panel-heading">
        <h3 class="panel-title">
          Finances
          <span v-if="!selectedDateIsToday">for {{ selectedDate.format('MMMM D') }}</span>
        </h3>
      </div>
      <spinner v-if="accounts.length === 0"></spinner>
      <div v-show="accounts.length > 0" class="panel-body">
        <accounts-balance-graph :accounts="accounts" :target="savingsTarget" v-on:date-selected="dateSelected"></accounts-balance-graph>
        <div class="row">
          <account-list :accounts="accounts" :selected-date="selectedDate" class="col-xs-6"></account-list>
          <accounts-variation :accounts="accounts" :selected-date="selectedDate" :target="savingsTarget" class="col-xs-6"></accounts-variation>
        </div>
        <h4>Recent transactions</h4>
      </div>
      <transaction-list :transactions="transactions"></transaction-list>
    </div>
  `
});