const TransactionListComponent = Vue.component('transaction-list', {
  props: ['transactions'],
  data: function() {
    return {
      page: 0
    };
  },
  computed: {
    paginatedTransactions: function() {
      return this.transactions.slice(0, 5 + 10 * this.page);
    }
  },
  methods: {
    nextPage: function() {
      this.page++;
      return false;
    }
  },
  template: `
    <table class="table table-condensed">
      <tbody class="inset">
        <tr v-for="transaction in paginatedTransactions" v-if="">
          <td>{{ transaction.accountDisplayName }}</td>
          <td :title="transaction.description">{{ transaction.title }}</td>
          <td>{{ transaction.date | date }}</td>
          <td class="balance">{{ transaction.amount | currency }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan=4 align="center">
            <a href="#" v-on:click.prevent="nextPage">Show more transactions</a>
          </td>
        </tr>
      </tfoot>
    </table>
  `
});