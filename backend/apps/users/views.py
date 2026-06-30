"""
Módulo de vistas (endpoints) del dominio Users.

Cada clase aquí es un endpoint de la API REST. Las vistas reciben
el request HTTP, delegan la validación al serializer correspondiente
y retornan una Response en formato JSON.

Endpoints expuestos (prefijo /api/v1/ en flowstate_backend/urls.py):
    GET            /ping/
    POST           /auth/login/
    POST           /auth/register/
    GET            /auth/verify-email/<token>/
    POST           /auth/resend-verification/
    POST           /auth/refresh/
    GET            /auth/me/            (legado)
    GET | PATCH    /users/me/
    POST           /auth/change-password/

Autenticación: JWT (JSON Web Token). El access token va en el
header 'Authorization: Bearer <token>' y expira en 60 minutos.
El refresh token viaja en cookie HttpOnly — no accesible por JS,
lo que protege contra ataques XSS.
"""

import os
import uuid

from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .permissions import IsDirectorOrAdmin
from .serializers import (ChangePasswordSerializer, LoginSerializer,
                          RegisterSerializer, ResendVerificationSerializer,
                          UpdateProfileSerializer, UserCreateSerializer,
                          UserSerializer)
from .utils import (generate_verification_token, send_verification_email,
                    verification_token_is_expired, verify_recaptcha)


def ping(request):
    """Health check — confirma que la app users está activa."""
    return JsonResponse({"status": "ok", "app": "users"})


class LoginView(APIView):
    """
    Endpoint de login: valida credenciales y emite tokens JWT.

    Flujo completo:
    1. Valida email, contraseña y reCAPTCHA (anti-bots).
    2. Si todo es correcto, genera dos tokens JWT:
       - access token (60 min): va en el body JSON. El frontend lo
         guarda en memoria y lo incluye en el header Authorization.
       - refresh token (7 días): va en cookie HttpOnly. El browser
         lo envía automáticamente, protegido contra robo por XSS.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Procesa el intento de login y emite los tokens JWT.
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # El LoginSerializer.validate() retorna el objeto User completo
        user = serializer.validated_data

        # Validación limpia de reCAPTCHA heredada de main
        recaptcha_token = request.data.get("recaptcha_token")
        if not verify_recaptcha(recaptcha_token, request.META.get("REMOTE_ADDR")):
            return Response(
                {"detail": "La validación CAPTCHA falló."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Bloqueo de seguridad: cuentas sin verificar no loguean
        if not user.is_verified:
            return Response(
                {"detail": "Cuenta no verificada. Revisa tu correo electrónico."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generación de tokens JWT
        refresh = RefreshToken.for_user(user)
        data = {
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }

        response = Response(data, status=status.HTTP_200_OK)

        secure_cookie = os.getenv("DJANGO_ENV", "development") == "production"
        response.set_cookie(
            "refresh",
            str(refresh),
            httponly=True,
            secure=secure_cookie,
            samesite="Lax",
            path="/",
            max_age=7 * 24 * 3600,
        )
        return response


class RegisterView(generics.CreateAPIView):
    """
    Endpoint de registro: crea un nuevo usuario y despacha token de correo.
    """

    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        recaptcha_token = serializer.validated_data.get("recaptcha_token")
        if not verify_recaptcha(recaptcha_token, request.META.get("REMOTE_ADDR")):
            return Response(
                {"detail": "La validación CAPTCHA falló."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Lógica transaccional segura rescatada de main
            with transaction.atomic():
                verification_token = generate_verification_token()
                user = serializer.save(verification_token=verification_token)
                send_verification_email(user)
        except Exception:
            return Response(
                {
                    "detail": "No se pudo enviar el correo de verificación. Intenta nuevamente."  # noqa: E501
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "message": "Usuario registrado. Revisa tu correo para verificar tu cuenta.",  # noqa: E501
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    """Endpoint para confirmar el correo usando el token enviado."""

    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            verification_token = uuid.UUID(str(token))
        except (ValueError, TypeError):
            return Response(
                {"detail": "Verification link is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(verification_token=verification_token)
        except User.DoesNotExist:
            return Response(
                {"detail": "Verification link is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verification_token_is_expired(user):
            return Response(
                {"detail": "Verification link has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_verified = True
        user.is_active = True
        user.email_verified_at = timezone.now()
        user.verification_token = None
        user.verification_token_created_at = None
        user.save(
            update_fields=[
                "is_verified",
                "is_active",
                "email_verified_at",
                "verification_token",
                "verification_token_created_at",
            ]
        )

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "message": "Cuenta verificada correctamente.",
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
        secure_cookie = os.getenv("DJANGO_ENV", "development") == "production"
        response.set_cookie(
            "refresh",
            str(refresh),
            httponly=True,
            secure=secure_cookie,
            samesite="Lax",
            path="/",
            max_age=7 * 24 * 3600,
        )
        return response


class ResendVerificationView(APIView):
    """Endpoint para solicitar un nuevo token de confirmación por correo."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        recaptcha_token = serializer.validated_data.get("recaptcha_token")

        if not verify_recaptcha(recaptcha_token, request.META.get("REMOTE_ADDR")):
            return Response(
                {"detail": "La validación CAPTCHA falló."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if not user or user.is_verified:
            return Response(
                {
                    "message": "Si la cuenta existe, se enviará un nuevo enlace de verificación."  # noqa: E501
                },
                status=status.HTTP_200_OK,
            )

        try:
            with transaction.atomic():
                user.verification_token = generate_verification_token()
                user.verification_token_created_at = timezone.now()
                user.save(
                    update_fields=[
                        "verification_token",
                        "verification_token_created_at",
                    ]
                )
                send_verification_email(user)
        except Exception:
            return Response(
                {"detail": "No se pudo reenviar el correo de verificación."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "message": "Si la cuenta existe, se enviará un nuevo enlace de verificación."  # noqa: E501
            },
            status=status.HTTP_200_OK,
        )


class RefreshFromCookieView(APIView):
    """
    Renueva el access token usando el refresh token de la cookie.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "No refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            token = RefreshToken(refresh_token)
            access = str(token.access_token)
            return Response(
                {"access": access},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class MeView(APIView):
    """
    Endpoints del perfil del usuario autenticado (GET y PATCH).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UpdateProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except EnvironmentError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            return Response(
                {"error": "Error al subir la imagen. Intenta de nuevo."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """
    Endpoint para cambiar la contraseña del usuario autenticado.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            errors = serializer.errors
            if "current_password" in errors:
                return Response(
                    {"error": errors["current_password"][0]},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            return Response(
                {"error": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response(
            {"detail": "Contraseña actualizada correctamente."},
            status=status.HTTP_200_OK,
        )


class UserCreateView(APIView):
    """
    Endpoint para crear usuarios Director o Administrador.

    Solo accesible para staff autenticado con rol Director o Admin.
    No se requiere contraseña en el request — el sistema genera una
    temporal y la devuelve en la respuesta para que el admin se la
    entregue al nuevo integrante.

    El usuario creado queda activo y verificado desde el primer
    momento (is_active=True, is_verified=True), sin necesitar
    confirmación por correo.

    Requiere JWT válido en el header: Authorization: Bearer <token>.
    """

    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]

    def post(self, request):
        """
        Crea un nuevo usuario Director o Administrador.

        Args:
            request: body con 'email', 'first_name', 'last_name',
                'phone' (opcional), 'role' y 'recaptcha_token'.

        Returns:
            201: datos del usuario creado + contraseña temporal.
            400: datos inválidos o reCAPTCHA fallido.
            403: el usuario autenticado no tiene rol Director/Admin.
        """
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verificamos reCAPTCHA antes de tocar la base de datos
        recaptcha_token = request.data.get("recaptcha_token")
        if not verify_recaptcha(recaptcha_token, request.META.get("REMOTE_ADDR")):
            return Response(
                {"detail": "La validación CAPTCHA falló."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # save() en UserCreateSerializer retorna (user, temp_password)
        user, temp_password = serializer.save()

        return Response(
            {
                "message": "Usuario creado correctamente.",
                "user": UserSerializer(user).data,
                # temp_password solo aparece aquí. El admin debe
                # anotarla o enviarla al nuevo usuario de inmediato
                # — no se puede recuperar después porque en BD
                # solo existe el hash.
                "temp_password": temp_password,
            },
            status=status.HTTP_201_CREATED,
        )
