const FinancesPanelComponent = Vue.component('finances-panel', {
  data: function() {
    return {
      accounts: [],
      selectedAccount: null,
      transactions: [],
      selectedDate: moment(),
      daysToShow: 180,
    }
  },
  computed: {
    savingsTarget: function() {
      return new SavingsTarget(
        this.selectedAccount ? [this.selectedAccount] : this.accounts,
        12500,
        moment(new Date(2018, 4, 1)), // 0-based month
        moment(new Date(2019, 3, 30))
      );
    },
    selectedDateIsToday: function() {
      return this.selectedDate.isSame(moment(), 'day');
    },
  },
  methods: {
    accountSelected: function(account) {
      this.selectedAccount = account;
    },
    dateSelected: function(date) {
      this.selectedDate = date.endOf('day');
    },
    selectDate: function(dateString) {
      if (dateString === 'today') {
        this.dateSelected(moment());
      } else if (dateString === 'tomorrow') {
        this.dateSelected(this.selectedDate.clone().add(1, 'days'));
      } else if (dateString === 'yesterday') {
        this.dateSelected(this.selectedDate.clone().subtract(1, 'days'));
      }
    },
  },
  created: function () {
    // Get at least 365 days of data
    AccountsService.getAccounts(Math.max(this.daysToShow, 365)).then(
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
            'panel-default': accounts.length === 0 || savingsTarget.isOnTrack(selectedDate) || selectedAccount,
            'panel-danger': accounts.length > 0 && !savingsTarget.isOnTrack(selectedDate) && !selectedAccount
        }">
      <div class="panel-heading">
        <h3 class="panel-title">
          <div class="pull-right">
            <a v-on:click="selectDate('yesterday')">
              <i class="glyphicon glyphicon-menu-left"></i>
            </a>

            <a v-if="!selectedDateIsToday" v-on:click="selectDate('today')">
              <i class="glyphicon glyphicon-calendar"></i>
            </a>
            <span class="text-muted" v-if="selectedDateIsToday">
              <i class="glyphicon glyphicon-calendar"></i>
            </span>

            <a v-if="!selectedDateIsToday" v-on:click="selectDate('tomorrow')">
              <i class="glyphicon glyphicon-menu-right"></i>
            </a>
            <span class="text-muted" v-if="selectedDateIsToday">
              <i class="glyphicon glyphicon-menu-right"></i>
            </span>
          </div>
          Finances
          <span v-if="!selectedDateIsToday">for {{ selectedDate.format('MMMM D') }}</span>
        </h3>
      </div>
      <spinner v-if="accounts.length === 0"></spinner>
      <div v-show="accounts.length > 0" class="panel-body">
        <accounts-balance-graph :accounts="accounts" :selected-account="selectedAccount" :target="savingsTarget" v-on:date-selected="dateSelected"></accounts-balance-graph>
        <div class="row">
          <account-list :accounts="accounts" :selected-account="selectedAccount" :selected-date="selectedDate" v-on:account-selected="accountSelected" class="col-xs-6"></account-list>
          <accounts-variation :accounts="accounts" :selected-account="selectedAccount" :selected-date="selectedDate" :target="savingsTarget" class="col-xs-6"></accounts-variation>
        </div>
        <h4>Recent transactions</h4>
      </div>
      <transaction-list :transactions="transactions"></transaction-list>
    </div>
  `
});