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
        raise serializers.ValidationError("Credenciales incorrectas o cuenta inactiva.")


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

        fields = ["email", "password", "first_name", "last_name", "phone", "role"]
        extra_kwargs = {
            "first_name": {"required": True, "allow_blank": False},
            "last_name": {"required": True, "allow_blank": False},
        }

    def validate_role(self, value):
        if value not in [User.Role.CLIENTE, User.Role.PROFESOR]:
            raise serializers.ValidationError(
                "El registro solo está permitido para clientes y profesores."
            )
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
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone=validated_data.get("phone", ""),
            role=validated_data.get("role", User.Role.CLIENTE),
        )
        return user


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Valida y crea un usuario con rol Director o Administrador.

    A diferencia de RegisterSerializer (registro público), este
    serializer es para crear staff interno. No recibe contraseña —
    se genera una temporal con generate_temp_password() y se
    devuelve junto al usuario para que el admin se la entregue
    al nuevo integrante.

    El usuario creado queda activo y verificado de inmediato:
    no necesita confirmar email porque un admin lo está registrando.
    """

    # write_only=True: entra en el request pero nunca aparece en la
    # respuesta JSON. Se descarta antes de crear el usuario en BD.
    recaptcha_token = serializers.CharField(write_only=True)

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
        """
        Restringe los roles a Director y Administrador.

        Args:
            value (str): rol enviado en el request.

        Returns:
            str: el rol si es válido.

        Raises:
            ValidationError: si el rol no es Director ni Administrador.
        """
        allowed = [User.Role.DIRECTOR, User.Role.ADMIN]
        if value not in allowed:
            raise serializers.ValidationError(
                "Este endpoint solo crea usuarios Director o Administrador."
            )
        return value

    def create(self, validated_data):
        """
        Crea el usuario con contraseña temporal generada automáticamente.

        Elimina recaptcha_token antes de pasar los datos a create_user()
        porque no es un campo del modelo User.

        Args:
            validated_data (dict): datos ya validados por DRF.

        Returns:
            tuple[User, str]: (instancia del usuario creado,
                contraseña temporal en texto plano). La contraseña
                solo existe aquí — en BD está almacenada como hash.
        """
        from .utils import generate_temp_password

        # Sacamos el token de reCAPTCHA — no pertenece al modelo User
        validated_data.pop("recaptcha_token", None)

        temp_password = generate_temp_password()

        user = User.objects.create_user(
            email=validated_data["email"],
            password=temp_password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone=validated_data.get("phone", ""),
            role=validated_data["role"],
            # Staff interno: no requiere verificación de email
            is_verified=True,
            is_active=True,
        )
        return user, temp_password


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

        # Opcional: Ejecuta las validaciones de contraseña por defecto de Django (longitud, etc.)  # noqa: E501
        user = self.context["request"].user
        validate_password(data["new_password"], user=user)

        return data


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # Limpia espacios innecesarios
        return value.strip().lower()


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
