from django.contrib import admin
from .models import Episode, EpisodeWatchStatus, StarredMovie


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ("title", "season", "episode", "date_added", "conversion_status")


@admin.register(EpisodeWatchStatus)
class EpisodeWatchStatusAdmin(admin.ModelAdmin):
    list_display = ("episode__title", "user", "last_watched", "stopped_at")


@admin.register(StarredMovie)
class StarredMovieAdmin(admin.ModelAdmin):
    list_display = ("tmdb_id", "user")
