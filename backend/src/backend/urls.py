from django.conf.urls import include
from django.urls import path
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from gps_logger.views import GpsLoggerView
from movies.views import (
    EpisodeProgressView,
    MovieListView,
    EpisodeStreamView,
    EpisodeView,
    EpisodeUnwatchedView,
    EpisodeWatchedView,
    TriageListView,
    EpisodeUnstarView,
    EpisodeStarView,
    DeleteOriginalView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/gps/", GpsLoggerView.as_view()),
    path("api/movies/", MovieListView.as_view()),
    path("api/movies/<int:id>/star/", EpisodeStarView.as_view()),
    path("api/movies/<int:id>/unstar/", EpisodeUnstarView.as_view()),
    path("api/movies/triage/", TriageListView.as_view()),
    path("api/episodes/<int:id>.mp4", EpisodeStreamView.as_view()),
    path("api/episodes/<int:id>/", EpisodeView.as_view()),
    path("api/episodes/<int:id>/originalFile/", DeleteOriginalView.as_view()),
    path("api/episodes/<int:id>/progress/", EpisodeProgressView.as_view()),
    path("api/episodes/<int:id>/unwatched/", EpisodeUnwatchedView.as_view()),
    path("api/episodes/<int:id>/watched/", EpisodeWatchedView.as_view()),
    path("auth/", include("authentication.urls")),
]
urlpatterns += staticfiles_urlpatterns()
