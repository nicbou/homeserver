from django.conf.urls import include
from django.urls import path
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from movies.views import EpisodeProgressView, MovieListView, EpisodeView, EpisodeAccessTokenView, \
    EpisodeUnwatchedView, EpisodeWatchedView, EpisodeConversionCallbackView, TriageListView, \
    EpisodeUnstarView, EpisodeStarView, EpisodeConvertView, DeleteOriginalView, \
    EpisodeExtractSubtitlesView

urlpatterns = [
    path('auth/', include('authentication.urls')),
    path('admin/', admin.site.urls),
    path('movies/', MovieListView.as_view()),
    path('movies/<int:id>/', EpisodeView.as_view()),
    path('movies/<int:id>/token/', EpisodeAccessTokenView.as_view()),
    path('movies/<int:id>/watched/', EpisodeWatchedView.as_view()),
    path('movies/<int:id>/unwatched/', EpisodeUnwatchedView.as_view()),
    path('movies/<int:id>/progress/', EpisodeProgressView.as_view()),
    path('movies/<int:id>/convert/', EpisodeConvertView.as_view()),
    path('movies/<int:id>/extractSubtitles/', EpisodeExtractSubtitlesView.as_view()),
    path('movies/<int:id>/originalFile/', DeleteOriginalView.as_view()),
    path('movies/<int:id>/star/', EpisodeStarView.as_view()),
    path('movies/<int:id>/unstar/', EpisodeUnstarView.as_view()),
    path('movies/triage/', TriageListView.as_view()),
    path('movies/convert/callback/', EpisodeConversionCallbackView.as_view()),
]
urlpatterns += staticfiles_urlpatterns()
