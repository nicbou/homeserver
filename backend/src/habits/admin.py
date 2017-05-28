from django.contrib import admin
from models import Account, Balance, Transaction


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name',)
