from django.conf.urls import include
from django.urls import path
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from movies.views import JSONMovieListView, JSONMovieTriageListView, JSONMovieView, JSONMovieConversionCallbackView, \
    JSONMovieAccessTokenView, JSONMovieWatchedView, JSONMovieUnwatchedView, JSONMovieProgressView, JSONMovieConvertView

urlpatterns = [
    path('auth/', include('authentication.urls')),
    path('admin/', admin.site.urls),
    path('movies/', JSONMovieListView.as_view()),
    path('movies/<int:id>/', JSONMovieView.as_view()),
    path('movies/<int:id>/token/', JSONMovieAccessTokenView.as_view()),
    path('movies/<int:id>/watched/', JSONMovieWatchedView.as_view()),
    path('movies/<int:id>/unwatched/', JSONMovieUnwatchedView.as_view()),
    path('movies/<int:id>/progress/', JSONMovieProgressView.as_view()),
    path('movies/<int:id>/convert/', JSONMovieConvertView.as_view()),
    path('movies/triage/', JSONMovieTriageListView.as_view()),
    path('movies/videoToMp4/callback/', JSONMovieConversionCallbackView.as_view()),
]
urlpatterns += staticfiles_urlpatterns()
