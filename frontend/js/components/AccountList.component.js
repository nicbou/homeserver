const AccountListComponent = Vue.component('account-list', {
  props: ['accounts', 'selectedDate'],
  computed: {
    totalBalance: function() {
      return this.accounts
        .map(account => account.balanceForDate(this.selectedDate))
        .reduce((a,b) => a + b, 0);
    }
  },
  template: `
    <div>
      <div class="alert alert-default">
        <h3>
          {{ totalBalance | currency }} <small>in all accounts</small>
        </h3>
      </div>
      <account-list-item v-for="account in accounts" :key="account.name" :account="account" :selectedDate="selectedDate"></account-list-item>
    </div>
  `,
  components: [
    AccountListItemComponent,
  ]
});