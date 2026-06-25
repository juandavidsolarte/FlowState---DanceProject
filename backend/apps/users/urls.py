"""
Configuración de URLs del dominio Users.

Define las rutas bajo el prefijo /api/v1/ (configurado en
flowstate_backend/urls.py). Cualquier nueva ruta de este dominio
debe agregarse aquí.

Rutas disponibles:
    GET            /api/v1/ping/
    POST           /api/v1/auth/login/
    POST           /api/v1/auth/register/
    POST           /api/v1/auth/refresh/
    GET            /api/v1/auth/me/         (legado)
    GET | PATCH    /api/v1/users/me/
    POST           /api/v1/auth/change-password/
"""

from django.urls import path

from . import views

app_name = "users"

urlpatterns = [
    path("ping/", views.ping, name="ping"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path(
        "auth/register/",
        views.RegisterView.as_view(),
        name="register",
    ),
    path(
        "auth/refresh/",
        views.RefreshFromCookieView.as_view(),
        name="refresh",
    ),
    # Ruta legada: el frontend actual la usa para el GET del perfil.
    # Se mantiene para no romper nada mientras se migra a /users/me/.
    path("auth/me/", views.MeView.as_view(), name="me"),
    # Ruta canónica del perfil (SCRUM-61): acepta GET y PATCH.
    # El frontend nuevo debe apuntar aquí para actualizar el perfil.
    path("users/me/", views.MeView.as_view(), name="me-profile"),
    path(
        "auth/change-password/",
        views.ChangePasswordView.as_view(),
        name="change-password",
    ),
]
