const AccountListItemComponent = Vue.component('account-list-item', {
  props: ['account', 'selectedDate', 'selectedAccount'],
  computed: {
    variationString: function() {
      const variationDay = this.account.variationForNumberOfDays(1, this.selectedDate);
      const variationWeek = this.account.variationForNumberOfDays(7, this.selectedDate);
      const variationMonth = this.account.variationForNumberOfDays(30, this.selectedDate);

      const variationDayString = variationDay > 0 ? '+' + currencyFilter(variationDay) : currencyFilter(variationDay);
      const variationWeekString = variationWeek > 0 ? '+' + currencyFilter(variationWeek) : currencyFilter(variationWeek);
      const variationMonthString = variationMonth > 0 ? '+' + currencyFilter(variationMonth) : currencyFilter(variationMonth);
      
      return `${variationDayString} today, \n${variationWeekString} this week, \n${variationMonthString} this month`;
    },
    variationDay: function() {
      return this.account.variationForNumberOfDays(1, this.selectedDate); 
    },
    balance: function () {
      return currencyFilter(this.account.balanceForDate(this.selectedDate));
    },
    isSelected: function () {
      return this.selectedAccount === this.account;
    }
  },
  methods: {
    accountSelected() {
      if (this.selectedAccount === this.account) {
        this.$emit('account-selected', null);
      } else {
        this.$emit('account-selected', this.account);
      }
    },
  },
  template: `
    <div class="status" :class="{selected: isSelected}" v-on:click="accountSelected()">
      <div class="status-details">
        <span class="balance" :title="variationString">
          {{ balance }}
          <i class="glyphicon"
            :class="{
              'text-muted': variationDay >= -1,
              'text-danger': variationDay < -1,
              'glyphicon-triangle-top': variationDay > 1,
              'glyphicon-triangle-bottom': variationDay < -1,
              'glyphicon-minus': variationDay >= -1 && variationDay <= 1,
            }"></i>
        </span>
        {{ account.displayName }}
      </div>
    </div>
  `
});