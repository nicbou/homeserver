from django.conf.urls import include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from finances.views import JSONAccountListView, JSONTransactionListView
from habits.views import JSONHabitListView

urlpatterns = [
    url(r'^accounts$', JSONAccountListView.as_view(), name='accounts_json'),
    url(r'^transactions$', JSONTransactionListView.as_view(), name='transactions_json'),
    url(r'^habits$', JSONHabitListView.as_view(), name='habits_json'),
    url(r'^admin/', include(admin.site.urls)),
]
urlpatterns += staticfiles_urlpatterns()
