"""
Módulo de permisos personalizados del dominio Users.

Define clases que extienden BasePermission de DRF para controlar
el acceso a endpoints según el rol del usuario autenticado.

En DRF, los permisos se evalúan en orden en la lista
permission_classes. Si alguno retorna False, la vista devuelve
403 Forbidden automáticamente antes de ejecutar cualquier lógica.
"""

from rest_framework.permissions import BasePermission

from .models import User


class IsDirectorOrAdmin(BasePermission):
    """
    Permite acceso solo a usuarios con rol Director o Administrador.

    Se usa combinado con IsAuthenticated en vistas de gestión de
    usuarios internos (crear cuentas de staff, etc.). Un usuario
    autenticado con rol Profesor o Cliente recibe 403 Forbidden.
    """

    message = (
        "Solo usuarios con rol Director o Administrador " "pueden realizar esta acción."
    )

    def has_permission(self, request, view):
        """
        Verifica autenticación y rol en una sola comprobación.

        DRF llama este método en cada request antes de ejecutar
        el handler del endpoint (get, post, patch, etc.).

        Args:
            request: el request HTTP con el usuario autenticado.
            view: la vista accedida (no se usa directamente aquí).

        Returns:
            bool: True si el usuario es Director o Admin, False si no.
        """
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (User.Role.DIRECTOR, User.Role.ADMIN)
        )
