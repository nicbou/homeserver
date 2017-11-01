from utils.views import LoginRequiredMixin
from django.http import JsonResponse
from .models import Habit
from django.views import View
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class JSONHabitListView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        json_habits = []
        for habit in Habit.objects.all():
            json_habits.append({
                'id': habit.id,
                'displayName': habit.name,
                'occurences': [occ.date for occ in habit.occurences.all()],
                'minimumSuccessfulDays': habit.minimum_successful_days,
                'daysPerPeriod': habit.days_per_period,
            })

        return JsonResponse({'habits': json_habits})


class JSONHabitToggleView(View):
    def post(self, request, *args, **kwargs):
        habit = get_object_or_404(Habit, pk=kwargs.get('id'))
        date = datetime.strptime(kwargs.get('date'), "%Y-%m-%d")
        next_day = date + timedelta(1)
        occurence = habit.occurences.filter(date__gte=date, date__lt=next_day)

        day_successful = False
        if occurence:
            occurence.delete()
        else:
            day_successful = True
            habit.occurences.create(date=date)

        return JsonResponse({'status': day_successful})
