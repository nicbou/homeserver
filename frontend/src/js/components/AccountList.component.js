const AccountListComponent = Vue.component('account-list', {
  props: ['accounts', 'selectedDate', 'selectedAccount'],
  computed: {
    activeAccounts: function() {
      return this.accounts.filter(a => a.isActive);
    },
    totalBalance: function() {
      return this.activeAccounts
        .map(account => account.balanceForDate(this.selectedDate))
        .reduce((a,b) => a + b, 0);
    },
  },
  methods: {
    accountSelected(account) {
      this.$emit('account-selected', account);
    },
  },
  template: `
    <div>
      <div class="alert alert-default">
        <h3>
          {{ totalBalance | currency }} <small>in all accounts</small>
        </h3>
      </div>
      <account-list-item v-on:account-selected="accountSelected" v-for="account in activeAccounts" :key="account.name" :account="account" :selectedDate="selectedDate" :selectedAccount="selectedAccount"></account-list-item>
    </div>
  `,
  components: [
    AccountListItemComponent,
  ]
});