const HabitsPanelComponent = Vue.component('habits-panel', {
  data: function() {
    return {
      habits: [],
      daysToShow: 60,
    };
  },
  created: function () {
    const habitsService = new HabitsService();
    habitsService.getHabits().then(
      (habits) => {
        this.habits = habits;
      },
      () => {
        this.habits = [];
      }
    )
  },
  mounted: function() {
    this.$el.querySelector('.timelines').scrollLeft = 100000000;
  },
  computed: {
    days: function() {
      const today = moment().startOf('day');
      const dates = [];
      for (let daysAgo = 0; daysAgo <= this.daysToShow; daysAgo++) {
        dates.push(moment().subtract(daysAgo, 'days'));
      }
      dates.reverse();
      dates[dates.length - 1].isToday = true;
      return dates;
    },
    allHabitsSuccessful: function() {
      return !this.habits.some(h => !h.isSuccessful());
    }
  },
  methods: {
    toggleHabit: function(habit, date) {
      habit.toggleDate(date);
      return new HabitsService().toggleDate(habit, date);
    }
  },
  template: `
    <div class="panel" v-bind:class="{ 'panel-default': allHabitsSuccessful, 'panel-danger': !allHabitsSuccessful }">
      <div class="panel-heading">
        <h3 class="panel-title">Habits</h3>
      </div>
      <div class="panel-body">
        <spinner v-if="habits.length === 0"></spinner>
        <div class="habits">
          <div class="goals">
            <div class="goal"></div>
            <div v-for="habit in habits" class="goal">{{ habit.displayName }}</div>
          </div>
          <div class="timelines">
            <div class="timeline">
              <div v-for="day in days" class="day" :class="{today: day.isToday}">
                {{ day.date() }}
              </div>
            </div>
            <div class="timeline habit" :class="{ success: habit.isSuccessful(), danger: !habit.isSuccessful() }" v-for="habit in habits">
              <div
                :class="{ day: true, success: habit.isSuccessfulForDate(day), danger: !habit.isSuccessfulForDate(day), 'in-period': habit.isDateInPeriod(day)}"
                v-for="day in days"
                v-on:click="toggleHabit(habit, day)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
});