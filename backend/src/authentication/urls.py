from django.conf.urls import url
from .views import check_auth
from django.contrib.auth.views import login

urlpatterns = [
    url(r'^$', login, name='login'),
    url(r'^verify/$', check_auth, name='check_auth'),
]
