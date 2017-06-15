class HabitsService {
  static getHabits() {
    return Api.request.get('/habits')
      .then((response) => {
        const habits = response.data.habits.map((habit) => new Habit(habit));
        resolve(habits);
      });
  }

  static toggleDate(habit, date) {
    const formattedDate = date.format('YYYY-MM-DD');
    return Api.request.post(`/habits/toggle/${habit.id}/${formattedDate}/`)
  }
}