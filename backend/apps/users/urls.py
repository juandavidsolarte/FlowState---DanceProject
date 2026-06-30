"""
Configuración de URLs del dominio Users.

Define las rutas bajo el prefijo /api/v1/ (configurado en
flowstate_backend/urls.py). Cualquier nueva ruta de este dominio
debe agregarse aquí.

Rutas disponibles:
    GET            /api/v1/ping/
    POST           /api/v1/auth/login/
    POST           /api/v1/auth/register/
    GET            /api/v1/auth/verify-email/<token>/
    POST           /api/v1/auth/resend-verification/
    POST           /api/v1/auth/refresh/
    GET            /api/v1/auth/me/         (legado)
    GET | PATCH    /api/v1/users/me/
    POST           /api/v1/auth/change-password/
    POST           /api/v1/users/           (SCRUM-24)
"""

from django.urls import path

from . import views

app_name = "users"

urlpatterns = [
    # Rutas Base e Inicio de Sesión
    path("ping/", views.ping, name="ping"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path(
        "auth/refresh/",
        views.RefreshFromCookieView.as_view(),
        name="refresh",
    ),
    # Rutas de Verificación de Cuenta
    path(
        "auth/verify-email/<uuid:token>/",
        views.VerifyEmailView.as_view(),
        name="verify-email",
    ),
    path(
        "auth/resend-verification/",
        views.ResendVerificationView.as_view(),
        name="resend-verification",
    ),
    # Perfil de Usuario
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("users/me/", views.MeView.as_view(), name="me-profile"),
    # Seguridad (De feature/US-003)
    path(
        "auth/change-password/",
        views.ChangePasswordView.as_view(),
        name="change-password",
    ),
    # Gestión de usuarios staff (SCRUM-24 — solo Director/Admin)
    path("users/", views.UserCreateView.as_view(), name="user-create"),
]
