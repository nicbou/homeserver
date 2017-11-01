from django.utils.decorators import method_decorator
from tokenapi.decorators import token_required


class LoginRequiredMixin(object):
    """View mixin which requires that the user is authenticated."""

    @method_decorator(token_required)
    def dispatch(self, request, *args, **kwargs):
        return super(LoginRequiredMixin, self).dispatch(request, *args, **kwargs)
