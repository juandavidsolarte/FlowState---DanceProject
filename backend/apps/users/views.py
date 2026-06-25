import uuid
import os
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from .models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics

from .serializers import (
    LoginSerializer,
    UserSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .utils import (
    generate_verification_token,
    send_verification_email,
    verification_token_is_expired,
    verify_recaptcha,
)


def ping(request):
    return JsonResponse({'status': 'ok', 'app': 'users'})

#Esta vista procesará el reCAPTCHA, validará al usuario y generará los tokens JWT (Access y Refresh).
#vista personalizada que añadimos es útil si:
# verificar reCAPTCHA antes de emitir tokens,
#devolver la información del usuario serializada junto con tokens,
#  lógica extra (registro de intentos, comprobaciones adicionales). 

class LoginView(APIView):
    permission_classes = [AllowAny] # Permitir acceso público

    def post(self, request):
        
        #Recibe datos del frontend (usuario, contraseña, etc.)
        serializer = LoginSerializer(data=request.data)
        #Valida los datos recibidos (correo, contraseña, reCAPTCHA)
        serializer.is_valid(raise_exception=True)

        # serializer.validate returns the user instance
        user = serializer.validated_data

        # Optional reCAPTCHA verification if SECRET present
        recaptcha_token = request.data.get('recaptcha_token')
        if not verify_recaptcha(recaptcha_token, request.META.get('REMOTE_ADDR')):
            return Response({'detail': 'La validación CAPTCHA falló.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_verified:
            return Response({'detail': 'Cuenta no verificada. Revisa tu correo electrónico.'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        data = {
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
        }

        # Set refresh token in HttpOnly cookie (frontend will not access it via JS)
        response = Response(data, status=status.HTTP_200_OK)
        # secure flag should be True in production (HTTPS)
        secure_cookie = os.getenv('DJANGO_ENV', 'development') == 'production'
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        recaptcha_token = serializer.validated_data.get('recaptcha_token')
        if not verify_recaptcha(recaptcha_token, request.META.get('REMOTE_ADDR')):
            return Response({'detail': 'La validación CAPTCHA falló.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                verification_token = generate_verification_token()
                user = serializer.save(verification_token=verification_token)
                send_verification_email(user)
        except Exception:
            return Response(
                {'detail': 'No se pudo enviar el correo de verificación. Intenta nuevamente.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                'message': 'Usuario registrado. Revisa tu correo para verificar tu cuenta.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            verification_token = uuid.UUID(str(token))
        except (ValueError, TypeError):
            return Response({'detail': 'Verification link is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(verification_token=verification_token)
        except User.DoesNotExist:
            return Response({'detail': 'Verification link is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        if verification_token_is_expired(user):
            return Response({'detail': 'Verification link has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_verified = True
        user.is_active = True
        user.email_verified_at = timezone.now()
        user.verification_token = None
        user.verification_token_created_at = None
        user.save(update_fields=['is_verified', 'is_active', 'email_verified_at', 'verification_token', 'verification_token_created_at'])

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                'message': 'Cuenta verificada correctamente.',
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
        secure_cookie = os.getenv('DJANGO_ENV', 'development') == 'production'
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


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        recaptcha_token = serializer.validated_data.get('recaptcha_token')

        if not verify_recaptcha(recaptcha_token, request.META.get('REMOTE_ADDR')):
            return Response({'detail': 'La validación CAPTCHA falló.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {'message': 'Si la cuenta existe, se enviará un nuevo enlace de verificación.'},
                status=status.HTTP_200_OK,
            )

        if user.is_verified:
            return Response(
                {'message': 'Si la cuenta existe, se enviará un nuevo enlace de verificación.'},
                status=status.HTTP_200_OK,
            )

        try:
            with transaction.atomic():
                user.verification_token = generate_verification_token()
                user.verification_token_created_at = timezone.now()
                user.save(update_fields=['verification_token', 'verification_token_created_at'])
                send_verification_email(user)
        except Exception:
            return Response(
                {'detail': 'No se pudo reenviar el correo de verificación.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {'message': 'Si la cuenta existe, se enviará un nuevo enlace de verificación.'},
            status=status.HTTP_200_OK,
        )


class RefreshFromCookieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            return Response({'detail': 'No refresh token'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = RefreshToken(refresh_token)
            access = str(token.access_token)
            return Response({'access': access}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)
    
    
    
