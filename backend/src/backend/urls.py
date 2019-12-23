from django.conf.urls import include
from django.urls import path
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from finances.views import JSONAccountListView, JSONTransactionListView
from habits.views import JSONHabitListView, JSONHabitToggleView
from movies.views import JSONMovieListView, JSONMovieTriageListView, JSONMovieView, JSONMovieConversionCallbackView, \
    JSONMovieAccessTokenView, JSONMovieWatchedView, JSONMovieUnwatchedView, JSONMovieProgressView

urlpatterns = [
    path('auth/', include('authentication.urls')),
    path('admin/', admin.site.urls),
    path('accounts/', JSONAccountListView.as_view()),
    path('transactions/', JSONTransactionListView.as_view()),
    path('movies/', JSONMovieListView.as_view()),
    path('movies/<int:id>/', JSONMovieView.as_view()),
    path('movies/<int:id>/token/', JSONMovieAccessTokenView.as_view()),
    path('movies/<int:id>/watched/', JSONMovieWatchedView.as_view()),
    path('movies/<int:id>/unwatched/', JSONMovieUnwatchedView.as_view()),
    path('movies/<int:id>/progress/', JSONMovieProgressView.as_view()),
    path('movies/triage/', JSONMovieTriageListView.as_view()),
    path('movies/videoToMp4/callback/', JSONMovieConversionCallbackView.as_view()),
    path('habits/', JSONHabitListView.as_view()),
    path('habits/toggle/<int:id>/<date>/', JSONHabitToggleView.as_view()),
]
urlpatterns += staticfiles_urlpatterns()
