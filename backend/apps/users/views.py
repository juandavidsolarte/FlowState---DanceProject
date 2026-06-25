"""
Módulo de vistas (endpoints) del dominio Users.

Cada clase aquí es un endpoint de la API REST. Las vistas reciben
el request HTTP, delegan la validación al serializer correspondiente
y retornan una Response en formato JSON.

Endpoints expuestos (prefijo /api/v1/ en flowstate_backend/urls.py):
    GET            /ping/
    POST           /auth/login/
    POST           /auth/register/
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

import requests
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (ChangePasswordSerializer, LoginSerializer,
                          RegisterSerializer, UpdateProfileSerializer,
                          UserSerializer)


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

    # AllowAny porque cualquier persona puede intentar hacer login
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Procesa el intento de login y emite los tokens JWT.

        Args:
            request: body con 'email', 'password', 'recaptcha_token'.

        Returns:
            200: access token y datos del usuario en JSON.
            400: credenciales incorrectas o reCAPTCHA inválido.
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # El LoginSerializer.validate() retorna el objeto User completo
        user = serializer.validated_data

        # reCAPTCHA solo se verifica si RECAPTCHA_SECRET está en .env.
        # En desarrollo local generalmente no está, en producción sí.
        recaptcha_secret = os.getenv("RECAPTCHA_SECRET")
        recaptcha_token = request.data.get("recaptcha_token")
        if recaptcha_secret:
            try:
                resp = requests.post(
                    "https://www.google.com/recaptcha/api/siteverify",
                    data={
                        "secret": recaptcha_secret,
                        "response": recaptcha_token,
                    },
                    timeout=5,
                )
                j = resp.json()
                if not j.get("success"):
                    return Response(
                        {"detail": "reCAPTCHA verification failed."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except requests.RequestException:
                return Response(
                    {"detail": "reCAPTCHA verification error."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # for_user() genera el par refresh + access token vinculado al user
        refresh = RefreshToken.for_user(user)
        data = {
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }

        response = Response(data, status=status.HTTP_200_OK)

        # En producción secure=True obliga a enviar la cookie solo por
        # HTTPS. En desarrollo local lo desactivamos para poder probar.
        secure_cookie = os.getenv("DJANGO_ENV", "development") == "production"
        # httponly=True impide que JavaScript del browser lea la cookie,
        # protegiéndonos de ataques XSS que roban tokens de sesión.
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
    Endpoint de registro: crea un nuevo usuario con rol Cliente.

    Hereda de generics.CreateAPIView que ya maneja el POST y la
    creación del objeto. Sobreescribimos post() solo para personalizar
    el formato de la respuesta.
    """

    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        """
        Registra un nuevo usuario y retorna sus datos básicos.

        Args:
            request: body con 'email', 'password', 'first_name',
                'last_name', 'phone'.

        Returns:
            201: mensaje de éxito y datos del usuario creado.
            400: email ya registrado o datos inválidos.
        """
        response = super().post(request, *args, **kwargs)
        return Response(
            {
                "message": "Usuario registrado exitosamente",
                "user": response.data,
            },
            status=status.HTTP_201_CREATED,
        )


class RefreshFromCookieView(APIView):
    """
    Renueva el access token usando el refresh token de la cookie.

    El frontend llama este endpoint cuando el access token expira (60
    min). El browser envía la cookie HttpOnly automáticamente y Django
    emite un nuevo access token sin que el usuario vuelva a loguearse.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Lee la cookie 'refresh' y emite un nuevo access token.

        Args:
            request: debe incluir la cookie 'refresh' en los headers.

        Returns:
            200: nuevo 'access' token en JSON.
            401: sin cookie, o el refresh token expiró o es inválido.
        """
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
    Endpoints del perfil del usuario autenticado.

    GET   → devuelve los datos del perfil actual.
    PATCH → actualiza nombre, apellido, teléfono y/o avatar.

    Requiere JWT válido en el header: Authorization: Bearer <token>.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna el perfil del usuario autenticado.

        Returns:
            200: datos del usuario (sin contraseña ni tokens internos).
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        """
        Actualiza parcialmente el perfil del usuario autenticado.

        Con partial=True el usuario puede enviar solo los campos que
        quiere cambiar — no es necesario enviar todos en cada request.

        El avatar debe enviarse como archivo en multipart/form-data,
        no como JSON. El frontend debe usar FormData para esto.

        Args:
            request: puede incluir 'first_name', 'last_name', 'phone'
                y/o 'avatar' (archivo de imagen).

        Returns:
            200: perfil completo actualizado.
            400: campo inválido (teléfono con letras, imagen muy grande).
            503: Supabase no disponible o variables de entorno faltantes.
        """
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
            # Supabase no configurado: SUPABASE_URL o SUPABASE_KEY vacíos
            return Response(
                {"error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            # Error inesperado al subir a Supabase (red, permisos, etc.)
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

    Requiere la contraseña actual para confirmar que es el dueño de
    la cuenta antes de hacer el cambio. La nueva contraseña debe
    cumplir los requisitos de seguridad definidos en el serializer.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Cambia la contraseña si las validaciones pasan.

        Args:
            request: body con 'current_password' y 'new_password'.

        Returns:
            200: mensaje de confirmación.
            400: nueva contraseña no cumple los requisitos de seguridad.
            401: contraseña actual incorrecta.
        """
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            errors = serializer.errors
            # Contraseña actual incorrecta → 401 para indicar problema
            # de identidad, no de formato de datos
            if "current_password" in errors:
                return Response(
                    {"error": errors["current_password"][0]},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            # Otros errores de validación → 400 Bad Request
            return Response(
                {"error": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # set_password() hashea la contraseña antes de guardar en BD
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response(
            {"detail": "Contraseña actualizada correctamente."},
            status=status.HTTP_200_OK,
        )
