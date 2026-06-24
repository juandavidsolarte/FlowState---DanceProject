import os

import requests
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
)


def ping(request):
    return JsonResponse({'status': 'ok', 'app': 'users'})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data

        recaptcha_secret = os.getenv('RECAPTCHA_SECRET')
        recaptcha_token = request.data.get('recaptcha_token')
        if recaptcha_secret:
            try:
                resp = requests.post(
                    'https://www.google.com/recaptcha/api/siteverify',
                    data={
                        'secret': recaptcha_secret,
                        'response': recaptcha_token,
                    },
                    timeout=5,
                )
                j = resp.json()
                if not j.get('success'):
                    return Response(
                        {'detail': 'reCAPTCHA verification failed.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except requests.RequestException:
                return Response(
                    {'detail': 'reCAPTCHA verification error.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        refresh = RefreshToken.for_user(user)
        data = {
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
        }

        response = Response(data, status=status.HTTP_200_OK)
        secure_cookie = (
            os.getenv('DJANGO_ENV', 'development') == 'production'
        )
        response.set_cookie(
            'refresh',
            str(refresh),
            httponly=True,
            secure=secure_cookie,
            samesite='Lax',
            path='/',
            max_age=7 * 24 * 3600,
        )
        return response


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return Response(
            {
                "message": "Usuario registrado exitosamente",
                "user": response.data,
            },
            status=status.HTTP_201_CREATED,
        )


class RefreshFromCookieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'No refresh token'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            token = RefreshToken(refresh_token)
            access = str(token.access_token)
            return Response(
                {'access': access},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {'detail': 'Invalid refresh token'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UpdateProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except EnvironmentError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception:
            return Response(
                {'error': 'Error al subir la imagen. Intenta de nuevo.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        if not serializer.is_valid():
            errors = serializer.errors
            if 'current_password' in errors:
                return Response(
                    {'error': errors['current_password'][0]},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            return Response(
                {'error': errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(
            serializer.validated_data['new_password']
        )
        request.user.save()
        return Response(
            {'detail': 'Contraseña actualizada correctamente.'},
            status=status.HTTP_200_OK,
        )
