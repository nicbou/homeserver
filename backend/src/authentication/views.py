from django.http import HttpResponse


def check_auth(request):
    if request.user.is_authenticated:
        return HttpResponse()
    else:
        return HttpResponse(status=401)
