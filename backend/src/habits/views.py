from django.shortcuts import render
from utils.views import LoginRequiredMixin, JsonResponse
from django.core.serializers.json import DjangoJSONEncoder
from models import Habit, HabitOccurence


class JSONHabitListView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        if not settings.FEATURES['dashboard']['finances']:
            return HttpResponse(status=404)

        json_habits = []
        for habit in Habit.objects.all():
            json_habits.append({
                'id': habit.id,
                'displayName': habit.name,
                'occurences': [occ.date for occ in habit.occurences.all()],
                'minimumSuccessfulDays': habit.minimum_successful_days,
                'daysPerPeriod': habit.days_per_period,
            })

        return JsonResponse(json.dumps({'habits': json_habits}, cls=DjangoJSONEncoder))
