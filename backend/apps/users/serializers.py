import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Para retornar la info del usuario tras loguearse"""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'role', 'full_name', 'avatar_url',
        ]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    recaptcha_token = serializers.CharField(required=True)

    def validate(self, data):
        user = authenticate(
            email=data.get('email'),
            password=data.get('password'),
        )
        if user and user.is_active:
            return user
        raise serializers.ValidationError(
            "Credenciales incorrectas o cuenta inactiva."
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'phone']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=User.Role.CLIENTE,
        )
        return user


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Actualización parcial del perfil: nombre, apellido, teléfono, avatar."""

    avatar = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'avatar']

    def validate_phone(self, value):
        if value and not re.fullmatch(r'\d+', value):
            raise serializers.ValidationError("El teléfono debe ser numérico.")
        return value

    def validate_avatar(self, file):
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp']

        parts = file.name.rsplit('.', 1)
        ext = ('.' + parts[-1].lower()) if len(parts) == 2 else ''
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                "Formato de imagen no permitido. Usa jpg, png o webp."
            )

        if file.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Tipo de contenido no permitido. Usa jpg, png o webp."
            )

        max_size = 2 * 1024 * 1024  # 2 MB
        if file.size > max_size:
            raise serializers.ValidationError(
                "La imagen no puede superar los 2 MB."
            )

        return file

    def update(self, instance, validated_data):
        avatar_file = validated_data.pop('avatar', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if avatar_file is not None:
            from .services import SupabaseService
            public_url = SupabaseService.upload_avatar(
                avatar_file, avatar_file.name
            )
            instance.avatar_url = public_url

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        pattern = r'^(?=.*[A-Z])(?=.*\d).{8,}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "La nueva contraseña debe tener al menos 8 caracteres, "
                "una mayúscula y un número."
            )
        return value

    def validate(self, data):
        user = self.context['request'].user
        if not user.check_password(data.get('current_password')):
            raise serializers.ValidationError(
                {"current_password": "La contraseña actual es incorrecta."}
            )
        return data
