from django.contrib import admin
from .models import Movie, MovieWatchStatus


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'season', 'episode', 'date_added')


@admin.register(MovieWatchStatus)
class MovieWatchStatusAdmin(admin.ModelAdmin):
    list_display = ('movie', 'user', 'last_watched', 'stopped_at')
