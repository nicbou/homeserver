from django.conf.urls import url
from .views import check_auth, JSONPermissionsView
from django.contrib.auth.views import login

urlpatterns = [
    url(r'^$', login, name='login'),
    url(r'^verify/$', check_auth),
    url(r'^info/$', JSONPermissionsView.as_view()),
]
