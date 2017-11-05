from django.http import HttpResponse, JsonResponse
import re
from django.views import View
from django.contrib.auth.models import Permission

permission_checks = (
    ('^/torrents', 'authentication.torrents'),
    ('^/movies', 'authentication.movies_watch'),
)


def check_auth(request):
    original_url = request.META.get('HTTP_X_ORIGINAL_URI')
    if not original_url:
        return HttpResponse(status=401)

    if request.user.is_authenticated:
        for url_matcher, permission in permission_checks:
            if re.match(url_matcher, original_url) and not request.user.has_perm(permission):
                import logging
                logging.error('%s doesnt match %s', url_matcher, original_url)
                return HttpResponse(status=403)
        return HttpResponse()
    else:
        return HttpResponse(status=401)


class JSONPermissionsView(View):
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            JsonResponse({
                'result': 'failure',
                'message': 'Not authenticated'
            }, status=401)

        permissions = []
        if request.user.is_superuser:
            permissions = Permission.objects.all()
        else:
            permissions = request.user.user_permissions.all() | Permission.objects.filter(group__user=request.user)

        return JsonResponse({
            'user': request.user.get_username(),
            'isAdmin': request.user.is_superuser,
            'permissions': [p.codename for p in permissions]
        })
