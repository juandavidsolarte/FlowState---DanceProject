"""
Módulo de serializers del dominio Users.

Los serializers en DRF (Django REST Framework) cumplen dos funciones:
1. Validar los datos de entrada antes de tocar la base de datos.
2. Transformar objetos Python (modelos) a JSON para las respuestas.

Este módulo define los serializers para login, registro, actualización
de perfil y cambio de contraseña.
"""

import re

from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para exponer datos del usuario.

    Se usa en las respuestas del login y del endpoint GET /auth/me/
    para mostrar el perfil sin exponer campos sensibles como la
    contraseña o el verification_token.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "full_name",
            "avatar_url",
        ]


class LoginSerializer(serializers.Serializer):
    """
    Valida las credenciales de login antes de emitir tokens JWT.

    JWT (JSON Web Token) es el estándar que usamos para autenticación.
    Este serializer verifica que el email, la contraseña y el token de
    reCAPTCHA (verificación anti-bots) sean correctos.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    # write_only=True: el campo entra en el request pero nunca aparece
    # en la respuesta JSON — el token de reCAPTCHA no se devuelve.
    recaptcha_token = serializers.CharField(required=True)

    def validate(self, data):
        """
        Verifica las credenciales contra la base de datos.

        authenticate() busca un usuario activo con ese email y
        contraseña. Si no existe o la cuenta está desactivada,
        retorna None y se lanza el error.

        Args:
            data (dict): contiene 'email' y 'password'.

        Returns:
            User: instancia del usuario autenticado.

        Raises:
            ValidationError: si las credenciales son incorrectas o
                la cuenta está inactiva.
        """
        user = authenticate(
            email=data.get("email"),
            password=data.get("password"),
        )
        if user and user.is_active:
            return user
        raise serializers.ValidationError(
            "Credenciales incorrectas o cuenta inactiva."
        )


class RegisterSerializer(serializers.ModelSerializer):
    """
    Valida y crea un nuevo usuario con rol Cliente.

    Diseñado para el registro público. Nunca asigna roles de admin o
    director desde este endpoint — eso se hace directamente en BD.
    """

    # min_length=8 activa validación automática de DRF sin código extra
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User

        fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'role']
        extra_kwargs = {
            'first_name': {'required': True, 'allow_blank': False},
            'last_name': {'required': True, 'allow_blank': False},
        }

    def validate_role(self, value):
        if value not in [User.Role.CLIENTE, User.Role.PROFESOR]:
            raise serializers.ValidationError("El registro solo está permitido para clientes y profesores.")
        return value

    def create(self, validated_data):
        """
        Crea el usuario en BD con la contraseña hasheada.

        create_user() del manager llama set_password() internamente,
        así la contraseña nunca se guarda en texto plano en la BD.

        Args:
            validated_data (dict): datos ya validados por DRF.

        Returns:
            User: instancia del nuevo usuario creado.
        """
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=validated_data.get('role', User.Role.CLIENTE),
        )
        return user

