from django.http import HttpResponse, JsonResponse
import re
from movies.models import EpisodeAccessToken
from django.views import View
from django.contrib.auth.models import Permission
from urllib.parse import urlparse, parse_qs, unquote
import logging
from django.utils import timezone


permission_checks = (
    ('^/torrents', 'authentication.torrents'),
    ('^/movies', 'authentication.movies_watch'),
)

logger = logging.getLogger(__name__)


def check_auth(request):
    original_url = request.META.get('HTTP_X_ORIGINAL_URI')
    if not original_url:
        return HttpResponse(status=401)

    parsed_url = urlparse(original_url)
    querystring = parse_qs(parsed_url.query)

    if request.user.is_authenticated:
        for url_matcher, permission in permission_checks:
            if re.match(url_matcher, original_url) and not request.user.has_perm(permission):
                return HttpResponse(status=403)

        return HttpResponse()
    elif parsed_url.path.startswith('/movies') and 'token' in querystring:
        try:
            access_token = EpisodeAccessToken.objects.get(token=querystring['token'][0])
        except EpisodeAccessToken.DoesNotExist:
            return HttpResponse(status=403)
        if (
            access_token.expiration_date < timezone.now() or
            unquote(parsed_url.path) not in (
                access_token.episode.original_url,
                access_token.episode.converted_url,
                access_token.episode.srt_subtitles_url_en,
                access_token.episode.vtt_subtitles_url_en,
                access_token.episode.srt_subtitles_url_de,
                access_token.episode.vtt_subtitles_url_de,
                access_token.episode.srt_subtitles_url_fr,
                access_token.episode.vtt_subtitles_url_fr,
                access_token.episode.cover_url,
            )
        ):
            access_token.delete()
            return HttpResponse(status=403)
        else:
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
            'displayName': request.user.first_name or request.user.get_username(),
            'isAdmin': request.user.is_superuser,
            'permissions': [p.codename for p in permissions]
        })
