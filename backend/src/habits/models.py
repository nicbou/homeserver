from django.db import models


class Habit(models.Model):
    slug = models.CharField(max_length=75)  # Slug
    name = models.CharField(max_length=75)  # Display name
    minimum_successful_days = models.IntegerField(default=7)
    days_per_period = models.IntegerField(default=7)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


class HabitOccurence(models.Model):
    habit = models.ForeignKey(Habit, related_name='occurences', on_delete=models.CASCADE)
    extra_data = models.TextField(blank=True)
    date = models.DateTimeField()

    class Meta:
        ordering = ["-date"]
