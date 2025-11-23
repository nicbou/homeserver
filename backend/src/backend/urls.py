from django.conf.urls import include
from django.urls import path
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from gps_logger.views import GpsLoggerView
from movies.views import (
    EpisodeProgressView,
    MovieListView,
    EpisodeView,
    EpisodeUnwatchedView,
    EpisodeWatchedView,
    TriageListView,
    EpisodeUnstarView,
    EpisodeStarView,
    DeleteOriginalView,
)

urlpatterns = [
    path("auth/", include("authentication.urls")),
    path("admin/", admin.site.urls),
    path("api/gps/", GpsLoggerView.as_view()),
    path("api/movies/", MovieListView.as_view()),
    path("api/movies/<int:id>/", EpisodeView.as_view()),
    path("api/movies/<int:id>/watched/", EpisodeWatchedView.as_view()),
    path("api/movies/<int:id>/unwatched/", EpisodeUnwatchedView.as_view()),
    path("api/movies/<int:id>/progress/", EpisodeProgressView.as_view()),
    path("api/movies/<int:id>/originalFile/", DeleteOriginalView.as_view()),
    path("api/movies/<int:id>/star/", EpisodeStarView.as_view()),
    path("api/movies/<int:id>/unstar/", EpisodeUnstarView.as_view()),
    path("api/movies/triage/", TriageListView.as_view()),
]
urlpatterns += staticfiles_urlpatterns()
