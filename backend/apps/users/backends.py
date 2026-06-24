from django.contrib.auth import get_user_model


class EmailBackend:
    """Authenticate using email and password."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        email = kwargs.get("email") or username
        if email is None or password is None:
            return None
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def user_can_authenticate(self, user):
        is_active = getattr(user, "is_active", None)
        return is_active or is_active is None

    def get_user(self, user_id):
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
