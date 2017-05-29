class HabitsService extends JsonService {
  getHabits() {
    return new Promise((resolve, reject) => {
      this.getJson(`${API_URL}/habits`).then(
        (responseJson) => {
          const habits = responseJson.habits.map((habit) => new Habit(habit));
          resolve(habits);
        },
        (responseJson) => {
          reject(responseJson)
        }
      );
    });
  }

  toggleDate(habit, date) {
    const formattedDate = date.format('YYYY-MM-DD');
    return this.postJson(`${API_URL}/habits/toggle/${habit.id}/${formattedDate}/`)
  }
}