const AccountListItemComponent = Vue.component('account-list-item', {
  props: ['account', 'selectedDate'],
  data: function() {
    return {
      showVariation: false
    };
  },
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
    }
  },
  template: `
    <div class="status" v-on:click="showVariation = !showVariation">
      <div class="status-details">
        <span class="balance" :title="variationString">
          {{ balance }}
          <i class="glyphicon text-muted"
            :class="{
              'glyphicon-triangle-top': variationDay > 1,
              'glyphicon-triangle-bottom': variationDay < -1,
              'glyphicon-minus': variationDay >= -1 && variationDay <= 1,
            }"></i>
        </span>
        {{ account.displayName }}
        <span v-if="showVariation">
          <br>
          <small class="text-muted">
            {{ variationString }}
          </small>
        </span>
      </div>
    </div>
  `
});