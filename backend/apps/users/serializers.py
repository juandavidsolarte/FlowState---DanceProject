"""
Módulo de serializers del dominio Users.

Los serializers en DRF (Django REST Framework) cumplen dos funciones:
1. Validar los datos de entrada antes de tocar la base de datos.
2. Transformar objetos Python (modelos) a JSON para las respuestas.

Este módulo define los serializers para login, registro, actualización
de perfil y cambio de contraseña.
"""

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User
from .services import verify_recaptcha


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
        # 1. Validar reCAPTCHA primero
        # Esta función internamente ya verifica si settings.DEBUG es True
        if not verify_recaptcha(data.get("recaptcha_token")):
            raise serializers.ValidationError(
                "Error de verificación humana (reCAPTCHA)."
            )

        user = authenticate(
            email=data.get("email"),
            password=data.get("password"),
        )
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Credenciales incorrectas o cuenta inactiva.")


class RegisterSerializer(serializers.ModelSerializer):
    """
    Valida y crea un nuevo usuario con rol Cliente.
    """

    # Campos del modelo
    password = serializers.CharField(write_only=True, min_length=8)

    # Campos que vienen del frontend pero no se guardan en la BD
    confirm_password = serializers.CharField(write_only=True, required=True)
    recaptcha_token = serializers.CharField(write_only=True, required=True)
    age_confirmation = serializers.BooleanField(required=False)
    terms_accepted = serializers.BooleanField(required=False)

    class Meta:
        model = User

        fields = [
            "email",
            "password",
            "confirm_password",
            "recaptcha_token",
            "first_name",
            "last_name",
            "phone",
            "role",
            "date_of_birth",
            "country",
            "age_confirmation",
            "terms_accepted",
        ]

        extra_kwargs = {
            "first_name": {"required": True, "allow_blank": False},
            "last_name": {"required": True, "allow_blank": False},
            "role": {"required": False},
        }

    def validate_role(self, value):
        if value not in [User.Role.CLIENTE, User.Role.PROFESOR]:
            raise serializers.ValidationError(
                "El registro solo está permitido para clientes y profesores."
            )
        return value

    def validate(self, attrs):
        """
        Validaciones del registro.
        """

        # Verificar que ambas contraseñas coincidan
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Las contraseñas no coinciden."}
            )

        return attrs

    def create(self, validated_data):

        # Eliminar campos que NO pertenecen al modelo
        validated_data.pop("confirm_password", None)
        validated_data.pop("recaptcha_token", None)
        validated_data.pop("age_confirmation", None)
        validated_data.pop("terms_accepted", None)

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            phone=validated_data.get("phone", ""),
            date_of_birth=validated_data.get("date_of_birth"),
            country=validated_data.get("country", ""),
            role=validated_data.get("role", User.Role.CLIENTE),
        )

        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value

    def validate(self, data):
        if data["current_password"] == data["new_password"]:
            raise serializers.ValidationError(
                {
                    "new_password": "La nueva contraseña no puede ser igual a la anterior."  # noqa: E501
                }
            )

        # Validaciones integradas de Django (longitud mínima, contraseñas comunes, etc.)
        user = self.context["request"].user
        validate_password(data["new_password"], user=user)

        return data


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # Limpia espacios innecesarios
        return value.strip().lower()


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Crea un usuario con rol Director o Administrador.

    Usado en POST /api/v1/users/ (solo accesible para Director/Admin).
    No recibe contraseña — se genera una temporal y se devuelve en la
    respuesta. El usuario queda activo y verificado de inmediato.
    """

    # write_only: el token entra en el request pero nunca aparece en la respuesta
    recaptcha_token = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "recaptcha_token",
        ]
        extra_kwargs = {
            "phone": {"required": False, "allow_blank": True},
        }

    def validate_role(self, value):
        """Solo permite crear usuarios Director o Administrador desde este endpoint."""
        if value not in [User.Role.DIRECTOR, User.Role.ADMIN]:
            raise serializers.ValidationError(
                "Este endpoint solo crea usuarios con rol Director o Administrador."
            )
        return value

    def create(self, validated_data):
        """
        Crea el usuario con contraseña temporal y lo retorna junto a ella.

        El caller (UserCreateView) es el responsable de entregar la
        contraseña temporal al nuevo usuario — en BD solo se guarda el hash.
        Retorna (user, temp_password) en lugar del user solo.
        """
        from .utils import generate_temp_password

        validated_data.pop("recaptcha_token", None)
        temp_password = generate_temp_password()

        user = User.objects.create_user(
            email=validated_data["email"],
            password=temp_password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone=validated_data.get("phone", ""),
            role=validated_data["role"],
            is_verified=True,
            is_active=True,
        )
        return user, temp_password


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone", "date_of_birth", "avatar_url"]
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
            "phone": {"required": False, "allow_blank": True},
            "date_of_birth": {"required": False, "allow_null": True},
            "avatar_url": {"required": False, "allow_blank": True, "allow_null": True},
        }
