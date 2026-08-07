from django.contrib import admin
from .models import Episode, EpisodeWatchStatus, IgnoredTriageFile, StarredMovie


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ("title", "season", "episode", "date_added", "conversion_status")


@admin.register(EpisodeWatchStatus)
class EpisodeWatchStatusAdmin(admin.ModelAdmin):
    list_display = ("episode", "user", "last_watched", "stopped_at")


@admin.register(StarredMovie)
class StarredMovieAdmin(admin.ModelAdmin):
    list_display = ("tmdb_id", "user")


@admin.register(IgnoredTriageFile)
class IgnoredTriageFileAdmin(admin.ModelAdmin):
    list_display = ("path",)
