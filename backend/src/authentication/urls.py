from django.urls import path
from .views import check_auth, JSONPermissionsView
from django.contrib.auth.views import LoginView

urlpatterns = [
    path("", LoginView.as_view(), name="login"),
    path("verify/", check_auth),
    path("info/", JSONPermissionsView.as_view()),
]
