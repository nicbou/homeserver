from django.shortcuts import render
from utils.views import LoginRequiredMixin, JsonResponse
from django.core.serializers.json import DjangoJSONEncoder
from models import Habit, HabitOccurence
from django.views import View


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

        return JsonResponse(json.dumps({'status': day_successful}))
