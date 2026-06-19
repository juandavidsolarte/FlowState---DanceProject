from datetime import date

from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Para retornar la info del usuario tras loguearse"""
  
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'full_name',
            'avatar',
            'is_verified',
            'email_verified_at',
        ]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    recaptcha_token = serializers.CharField(required=True)  # Token enviado desde React
    
    #Consulta a la BD para validar el usuario y contraseña, si es correcto retorna el usuario, sino lanza error
    def validate(self, data):
        user = authenticate(email=data.get('email'), password=data.get('password'))
        if user and user.is_active:
            if not user.is_verified:
                raise serializers.ValidationError("Cuenta no verificada. Revisa tu correo electrónico.")
            return user
        raise serializers.ValidationError("Credenciales incorrectas o cuenta inactiva.")

class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    date_of_birth = serializers.DateField()
    country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    age_confirmation = serializers.BooleanField()
    terms_accepted = serializers.BooleanField(required=False, default=False)
    recaptcha_token = serializers.CharField(required=True)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("El correo electrónico ya está registrado.")
        return normalized

    def validate_password(self, value):
        try:
            password_validation.validate_password(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Las contraseñas no coinciden.'})

        if not attrs.get('age_confirmation'):
            raise serializers.ValidationError({'age_confirmation': 'Debes confirmar que eres mayor de 18 años.'})

        birth_date = attrs.get('date_of_birth')
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        if age < 18:
            raise serializers.ValidationError({'date_of_birth': 'Debes tener al menos 18 años para registrarte.'})

        if attrs.get('terms_accepted') is False:
            raise serializers.ValidationError({'terms_accepted': 'Debes aceptar los términos y condiciones.'})

        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            date_of_birth=validated_data.get('date_of_birth'),
            country=validated_data.get('country', ''),
            role=User.Role.CLIENTE,
            is_active=False,
            is_verified=False,
            verification_token=validated_data.get('verification_token'),
            verification_token_created_at=timezone.now(),
        )
        return user


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    recaptcha_token = serializers.CharField(required=True)

    def validate_email(self, value):
        return value.strip().lower()
