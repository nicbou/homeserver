from django.conf.urls import include
from django.urls import path
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from movies.views import JSONEpisodeProgressView, JSONMovieListView, JSONEpisodeView, JSONEpisodeAccessTokenView, \
    JSONEpisodeUnwatchedView, JSONEpisodeWatchedView, JSONEpisodeConversionCallbackView, JSONTriageListView, \
    JSONEpisodeUnstarView, JSONEpisodeStarView, JSONEpisodeConvertView, JSONDeleteOriginalView, \
    JSONEpisodeExtractSubtitlesView

urlpatterns = [
    path('auth/', include('authentication.urls')),
    path('admin/', admin.site.urls),
    path('movies/', JSONMovieListView.as_view()),
    path('movies/<int:id>/', JSONEpisodeView.as_view()),
    path('movies/<int:id>/token/', JSONEpisodeAccessTokenView.as_view()),
    path('movies/<int:id>/watched/', JSONEpisodeWatchedView.as_view()),
    path('movies/<int:id>/unwatched/', JSONEpisodeUnwatchedView.as_view()),
    path('movies/<int:id>/progress/', JSONEpisodeProgressView.as_view()),
    path('movies/<int:id>/convert/', JSONEpisodeConvertView.as_view()),
    path('movies/<int:id>/extractSubtitles/', JSONEpisodeExtractSubtitlesView.as_view()),
    path('movies/<int:id>/originalFile/', JSONDeleteOriginalView.as_view()),
    path('movies/<int:id>/star/', JSONEpisodeStarView.as_view()),
    path('movies/<int:id>/unstar/', JSONEpisodeUnstarView.as_view()),
    path('movies/triage/', JSONTriageListView.as_view()),
    path('movies/convert/callback/', JSONEpisodeConversionCallbackView.as_view()),
]
urlpatterns += staticfiles_urlpatterns()
