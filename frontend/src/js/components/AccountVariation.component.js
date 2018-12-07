const AccountsVariationComponent = Vue.component('accounts-variation', {
  props: ['accounts', 'target', 'selectedDate', 'selectedAccount'],
  computed: {
    variationDayPositive: function() {
      return this.target.variationDay(this.selectedDate) >= 0
    },
    variationWeekPositive: function() {
      return this.target.variationWeek(this.selectedDate) >= 0
    },
    variationMonthPositive: function() {
      return this.target.variationMonth(this.selectedDate) >= 0
    },
    variationYearPositive: function() {
      return this.target.variationYear(this.selectedDate) >= 0
    },
    variationStringDay: function() {
      const variation = this.target.variationDay(this.selectedDate);
      const variationString = currencyFilter(variation)
      return variation > 0 ? '+' + variationString : variationString;
    },
    variationStringWeek: function() {
      const variation = this.target.variationWeek(this.selectedDate);
      const variationString = currencyFilter(variation)
      return variation > 0 ? '+' + variationString : variationString;
    },
    variationStringMonth: function() {
      const variation = this.target.variationMonth(this.selectedDate);
      const variationString = currencyFilter(variation)
      return variation > 0 ? '+' + variationString : variationString;
    },
    variationStringYear: function() {
      const variation = this.target.variationYear(this.selectedDate);
      const variationString = currencyFilter(variation)
      return variation > 0 ? '+' + variationString : variationString;
    },
    isOnTrack: function() {
      return this.selectedAccount || this.target.isOnTrack(this.selectedDate);
    },
    selectedDateIsToday: function() {
      return this.selectedDate.isSame(moment(), 'day');
    },
  },
  template: `
    <div>
      <div class="alert" v-bind:class="{ 'alert-default': isOnTrack, 'alert-danger': !isOnTrack }">
        <h3>
          <span v-if="target.isStarted(selectedDate)">{{ target.amountSaved(selectedDate) | currency }} <small>saved <span v-if="selectedAccount">in this account</span></small></span>
          <span v-else>{{ 0 | currency }} <small>saved <span v-if="selectedAccount">in this account </span>(goal not started)</small></span>
        </h3>
      </div>
      <div class="status">
        <span class="status-icon label" v-bind:class="{ 'label-success': variationDayPositive, 'label-warning': !variationDayPositive }">
          <i class="glyphicon glyphicon-ok" v-bind:class="{ 'glyphicon-ok': variationDayPositive, 'glyphicon-flag': !variationDayPositive }"></i>
        </span>
        <div class="status-details">
          <span class="balance">{{ variationStringDay }}</span>
          <span v-if="selectedDateIsToday">Today</span>
          <span v-else>On {{ selectedDate.format('MMMM D') }}</span>
        </div>
      </div>
      <div class="status">
        <span class="status-icon label" v-bind:class="{ 'label-success': variationWeekPositive, 'label-warning': !variationWeekPositive }">
          <i class="glyphicon glyphicon-ok" v-bind:class="{ 'glyphicon-ok': variationWeekPositive, 'glyphicon-flag': !variationWeekPositive }"></i>
        </span>
        <div class="status-details">
          <span class="balance">{{ variationStringWeek }}</span>
          <span v-if="selectedDateIsToday">This week</span>
          <span v-else>That week</span>
        </div>
      </div>
      <div class="status">
        <span class="status-icon label" v-bind:class="{ 'label-success': variationMonthPositive, 'label-warning': !variationMonthPositive }">
          <i class="glyphicon glyphicon-ok" v-bind:class="{ 'glyphicon-ok': variationMonthPositive, 'glyphicon-flag': !variationMonthPositive }"></i>
        </span>
        <div class="status-details">
          <span class="balance">{{ variationStringMonth }}</span>
          <span v-if="selectedDateIsToday">This month</span>
          <span v-else>That month</span>
        </div>
      </div>
      <div class="status">
        <span class="status-icon label" v-bind:class="{ 'label-success': variationYearPositive, 'label-warning': !variationYearPositive }">
          <i class="glyphicon glyphicon-ok" v-bind:class="{ 'glyphicon-ok': variationYearPositive, 'glyphicon-flag': !variationYearPositive }"></i>
        </span>
        <div class="status-details">
          <span class="balance">{{ variationStringYear }}</span>
          <span v-if="selectedDateIsToday">This year</span>
          <span v-else>That year</span>
        </div>
      </div>
      <div class="status" v-if="target.isStarted(selectedDate) && !selectedAccount">
        <span v-if="isOnTrack" class="status-icon label label-success"><i class="glyphicon glyphicon-ok"></i></span>
        <span v-else class="status-icon label label-danger"><i class="glyphicon glyphicon-remove"></i></span>

        <div class="status-details">
          <span v-if="isOnTrack">{{ target.balanceForDate(selectedDate) - target.targetForDate(selectedDate) | currency }} above expected savings</span>
          <span v-else>{{ target.targetForDate(selectedDate) - target.balanceForDate(selectedDate) | currency }} below expected savings</span>
          <br>
          <small class="text-muted" v-if="target.amountLeftToSave(selectedDate) > 0">{{ target.daysLeft(selectedDate) }} days left to save remaining {{ target.amountLeftToSave(selectedDate) | currency }}</small>
        </div>
      </div>
    </div>
  `,
  components: [
    AccountListItemComponent,
  ]
});