from django.contrib.auth.models import Permission
from django.http import HttpResponseRedirect, HttpResponse, JsonResponse
from django.utils import timezone
from django.views import View
from movies.models import EpisodeAccessToken
from urllib.parse import urlparse, parse_qs, unquote
import logging
import re
import urllib.parse


permission_checks = (
    ('^/torrents', 'authentication.torrents'),
    ('^/movies', 'authentication.movies_watch'),
)

logger = logging.getLogger(__name__)


def check_auth(request):
    original_url = request.META.get('HTTP_X_FORWARDED_URI')
    redirect_url = '/auth/?next=' + urllib.parse.quote_plus(original_url)

    if not original_url:
        return HttpResponseRedirect(redirect_url)
    elif original_url.startswith('/auth/'):
        return HttpResponse()

    parsed_url = urlparse(original_url)
    querystring = parse_qs(parsed_url.query)

    if request.user.is_authenticated:
        for url_matcher, permission in permission_checks:
            if re.match(url_matcher, original_url) and not request.user.has_perm(permission):
                return HttpResponseRedirect(redirect_url)

        if request.path.startswith('/timeline') and not request.user.is_superuser:
            return HttpResponseRedirect(redirect_url)

        return HttpResponse()
    elif parsed_url.path.startswith('/movies') and 'token' in querystring:
        try:
            access_token = EpisodeAccessToken.objects.get(token=querystring['token'][0])
        except EpisodeAccessToken.DoesNotExist:
            return HttpResponseRedirect(redirect_url)
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
            return HttpResponseRedirect('/auth/')
        else:
            return HttpResponse()
    else:
        return HttpResponseRedirect('/auth/')


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
