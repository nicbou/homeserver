from base64 import b64decode
from django.contrib.auth import authenticate
from django.contrib.auth.models import Permission
from django.http import HttpResponseRedirect, HttpResponse, JsonResponse
from django.views import View
from urllib.parse import urlparse
import logging
import re
import urllib.parse


permission_checks = (
    ("^/torrents", "authentication.torrents"),
    ("^/movies", "authentication.movies_watch"),
)

logger = logging.getLogger(__name__)


def check_auth(request):
    original_url = request.META.get("HTTP_X_FORWARDED_URI")
    login_url = "/auth/?next=" + urllib.parse.quote_plus(original_url)

    continue_response = HttpResponse()
    login_response = HttpResponseRedirect(login_url, status=302)

    if not original_url:
        return login_response
    elif original_url.startswith("/auth/"):
        return continue_response

    parsed_url = urlparse(original_url)

    if request.user.is_authenticated:
        for url_matcher, permission in permission_checks:
            if re.match(url_matcher, original_url) and not request.user.has_perm(permission):
                return login_response

        if parsed_url.path.startswith("/timeline") and not request.user.is_superuser:
            return login_response

        return continue_response
    else:
        # Also accept basic auth as a fallback. OwnTracks uses basic auth for GPS pings.
        auth_header = request.META.get("HTTP_AUTHORIZATION")
        if not auth_header or not auth_header.startswith("Basic "):
            return login_response

        encoded = auth_header.split(" ", 1)[1].strip()
        username, password = b64decode(encoded).decode("utf-8").split(":", 1)
        user = authenticate(request, username=username, password=password)
        return continue_response if user else login_response


class JSONPermissionsView(View):
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            JsonResponse({"result": "failure", "message": "Not authenticated"}, status=401)

        permissions = []
        if request.user.is_superuser:
            permissions = Permission.objects.all()
        else:
            permissions = request.user.user_permissions.all() | Permission.objects.filter(group__user=request.user)

        return JsonResponse(
            {
                "user": request.user.get_username(),
                "displayName": request.user.first_name or request.user.get_username(),
                "isAdmin": request.user.is_superuser,
                "permissions": [p.codename for p in permissions],
            }
        )
