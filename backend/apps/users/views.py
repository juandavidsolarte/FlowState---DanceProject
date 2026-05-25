from django.http import JsonResponse
from .models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
import os
import requests         

from .serializers import LoginSerializer, UserSerializer, RegisterSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken


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
        recaptcha_secret = os.getenv('RECAPTCHA_SECRET')
        recaptcha_token = request.data.get('recaptcha_token')
        if recaptcha_secret:
            try:
                resp = requests.post(
                    'https://www.google.com/recaptcha/api/siteverify',
                    data={'secret': recaptcha_secret, 'response': recaptcha_token},
                    timeout=5,
                )
                j = resp.json()
                if not j.get('success'):
                    return Response({'detail': 'reCAPTCHA verification failed.'}, status=status.HTTP_400_BAD_REQUEST)
            except requests.RequestException:
                return Response({'detail': 'reCAPTCHA verification error.'}, status=status.HTTP_400_BAD_REQUEST)

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
        response = super().post(request, *args, **kwargs)
        return Response({
            "message": "Usuario registrado exitosamente",
            "user": response.data
        }, status=status.HTTP_201_CREATED)


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
    
    
    
