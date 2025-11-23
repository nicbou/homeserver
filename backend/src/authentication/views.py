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
    redirect_url = "/auth/?next=" + urllib.parse.quote_plus(original_url)

    if not original_url:
        return HttpResponseRedirect(redirect_url, status=302)
    elif original_url.startswith("/auth/"):
        return HttpResponse()

    parsed_url = urlparse(original_url)

    if request.user.is_authenticated:
        for url_matcher, permission in permission_checks:
            if re.match(url_matcher, original_url) and not request.user.has_perm(permission):
                return HttpResponseRedirect(redirect_url, status=302)

        if parsed_url.path.startswith("/timeline") and not request.user.is_superuser:
            return HttpResponseRedirect(redirect_url, status=302)

        return HttpResponse()
    else:
        return HttpResponseRedirect(redirect_url, status=302)


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
