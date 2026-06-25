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
        fields = ["email", "password", "first_name", "last_name", "phone"]

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
            # Todo registro público es Cliente por defecto
            role=User.Role.CLIENTE,
        )
        return user


class UpdateProfileSerializer(serializers.ModelSerializer):
    """
    Valida y aplica la actualización parcial del perfil de usuario.

    Maneja tres tipos de campos:
    - Texto: first_name, last_name, phone (con validación numérica).
    - Imagen: avatar con validación de formato y tamaño.
    - Si viene imagen, la sube a Supabase y guarda la URL resultante.

    Se usa con partial=True en la vista, así el usuario puede enviar
    solo los campos que quiere cambiar.
    """

    # ImageField de DRF acepta archivos multipart y rechaza automáticamente
    # lo que no sea imagen. required=False porque el avatar es opcional.
    avatar = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone", "avatar"]

    def validate_phone(self, value):
        """
        Valida que el teléfono contenga solo dígitos.

        Args:
            value (str): valor del campo 'phone' enviado por el usuario.

        Returns:
            str: el mismo valor si es válido.

        Raises:
            ValidationError: si el teléfono contiene letras o símbolos.
        """
        # re.fullmatch exige que TODA la cadena sea solo dígitos (0-9).
        # '123-456' fallaría porque tiene guión; '3001234567' pasa.
        if value and not re.fullmatch(r"\d+", value):
            raise serializers.ValidationError("El teléfono debe ser numérico.")
        return value

    def validate_avatar(self, file):
        """
        Valida el formato y el tamaño del archivo de imagen.

        Para QA: probar jpg, png, webp (válidos); pdf, gif, exe
        (inválidos); archivo de 2 MB exactos (válido) y 2.1 MB
        (inválido).

        Args:
            file: objeto InMemoryUploadedFile del request multipart.

        Returns:
            file: mismo objeto si pasa todas las validaciones.

        Raises:
            ValidationError: si el formato o tamaño no son válidos.
        """
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]

        # Separamos nombre y extensión del archivo recibido
        parts = file.name.rsplit(".", 1)
        ext = ("." + parts[-1].lower()) if len(parts) == 2 else ""

        # Validamos extensión Y content-type por seguridad.
        # Un usuario podría renombrar un .exe a .jpg — el content-type
        # lo delata porque el browser lo envía según el tipo real.
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                "Formato no permitido. Usa jpg, png o webp."
            )

        if file.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Tipo de contenido no permitido. Usa jpg, png o webp."
            )

        # 2 MB en bytes = 2 × 1024 × 1024 = 2,097,152 bytes
        max_size = 2 * 1024 * 1024
        if file.size > max_size:
            raise serializers.ValidationError(
                "La imagen no puede superar los 2 MB."
            )

        return file

    def update(self, instance, validated_data):
        """
        Aplica los cambios al usuario y sube el avatar si hay uno.

        Si se envió imagen: primero la sube a Supabase Storage,
        obtiene la URL pública y la guarda en avatar_url. Luego
        actualiza los demás campos de texto.

        Args:
            instance (User): el usuario autenticado que se actualiza.
            validated_data (dict): datos ya validados por DRF.

        Returns:
            User: instancia actualizada del usuario.
        """
        # Sacamos el avatar del dict antes de iterar — no es un campo
        # directo del modelo User y setattr lo ignoraría con error.
        avatar_file = validated_data.pop("avatar", None)

        # Actualizamos first_name, last_name, phone si vienen en el request
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if avatar_file is not None:
            # Importación local para evitar importaciones circulares
            from .services import SupabaseService

            public_url = SupabaseService.upload_avatar(
                avatar_file, avatar_file.name
            )
            # Guardamos la URL, no el archivo físico
            instance.avatar_url = public_url

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """
    Valida el cambio de contraseña de un usuario autenticado.

    Requiere la contraseña actual para confirmar identidad antes de
    permitir el cambio. La nueva contraseña pasa validación de
    seguridad definida en validate_new_password.
    """

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        """
        Aplica las reglas de seguridad a la nueva contraseña.

        Reglas (regex ^(?=.*[A-Z])(?=.*\\d).{8,}$):
        - Mínimo 8 caracteres.
        - Al menos una letra mayúscula.
        - Al menos un número.

        Args:
            value (str): nueva contraseña enviada por el usuario.

        Returns:
            str: la contraseña si cumple todos los requisitos.

        Raises:
            ValidationError: si no cumple el patrón de seguridad.
        """
        # Lookaheads: (?=.*[A-Z]) verifica que haya al menos una
        # mayúscula en cualquier posición; (?=.*\d) hace lo mismo
        # para números. .{8,} exige mínimo 8 caracteres en total.
        pattern = r"^(?=.*[A-Z])(?=.*\d).{8,}$"
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "La contraseña debe tener mínimo 8 caracteres, "
                "una mayúscula y un número."
            )
        return value

    def validate(self, data):
        """
        Verifica que la contraseña actual sea correcta.

        Se ejecuta después de validate_new_password. Usa check_password()
        de Django, que hashea el input y lo compara con el hash en BD
        — nunca compara texto plano con texto plano.

        Args:
            data (dict): contiene 'current_password' y 'new_password'.

        Returns:
            dict: datos validados si la contraseña actual es correcta.

        Raises:
            ValidationError: si la contraseña actual no coincide.
        """
        user = self.context["request"].user
        if not user.check_password(data.get("current_password")):
            raise serializers.ValidationError(
                {"current_password": ("La contraseña actual es incorrecta.")}
            )
        return data
