"""
Módulo de modelos del dominio Users.

Define el modelo personalizado de usuario (User) que reemplaza al
User estándar de Django. Autentica por email en lugar de username,
define los cuatro roles del negocio y almacena la URL del avatar
subido a Supabase Storage.
"""

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Modelo principal de usuario de FlowState.

    Extiende AbstractBaseUser para personalizar el sistema de auth de
    Django: el login es por email, no por username. PermissionsMixin
    agrega soporte para grupos y permisos del admin de Django.

    El campo avatar_url guarda solo la URL pública de Supabase —
    el archivo físico vive en el bucket 'avatars', no en el servidor.
    """

    class Role(models.TextChoices):
        """Roles disponibles en la plataforma."""

        DIRECTOR = "director", "Director"
        ADMIN = "admin", "Administrador"
        PROFESOR = "profesor", "Profesor"
        CLIENTE = "cliente", "Cliente"

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    date_of_birth = models.DateField(null=True, blank=True)
    country = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENTE)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    # URL pública del avatar en Supabase (Tomado de la rama feature/US-003 por compatibilidad con la migración)  # noqa: E501
    avatar_url = models.CharField(max_length=500, null=True, blank=True)

    # Campos de verificación avanzados (Mantenidos y rescatados de tu Main original)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    verification_token = models.UUIDField(
        null=True, blank=True, unique=True, db_index=True
    )
    verification_token_created_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    # Django usa este campo para identificar al usuario en el login
    # en lugar del username estándar.
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "users"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        """Representación legible del usuario para el panel de admin."""
        return f"{self.email} ({self.get_role_display()})"

    @property
    def full_name(self):
        """Nombre completo calculado — no se persiste en base de datos."""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_director(self):
        """True si el usuario tiene rol Director."""
        return self.role == self.Role.DIRECTOR

    @property
    def is_profesor(self):
        """True si el usuario tiene rol Profesor."""
        return self.role == self.Role.PROFESOR
