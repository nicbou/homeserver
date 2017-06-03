from django.conf.urls import include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from finances.views import JSONAccountListView, JSONTransactionListView
from habits.views import JSONHabitListView, JSONHabitToggleView

urlpatterns = [
    url(r'^token/', include('tokenapi.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^accounts/$', JSONAccountListView.as_view()),
    url(r'^transactions/$', JSONTransactionListView.as_view()),
    url(r'^habits/$', JSONHabitListView.as_view()),
    url(
        r'^habits/toggle/(?P<id>\d+)/(?P<date>\d{4}-\d{2}-\d{2})/$',
        JSONHabitToggleView.as_view()
    ),
]
urlpatterns += staticfiles_urlpatterns()
