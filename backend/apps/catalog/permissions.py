"""
Módulo de permisos personalizados del dominio Catalog.

Define clases que extienden BasePermission de DRF para controlar
el acceso a la gestión de coreografías y géneros según el rol
del usuario autenticado y, en el caso de edición, la propiedad
del recurso.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.users.models import User


class IsProfesorOrAdmin(BasePermission):
    """
    Permite crear coreografías solo a usuarios con rol Profesor,
    Administrador o Director.

    Se usa en el ViewSet de Coreografia para restringir el método
    create: un Cliente autenticado recibe 403 Forbidden.
    """

    message = (
        "Solo usuarios con rol Profesor, Administrador o Director "
        "pueden realizar esta acción."
    )

    def has_permission(self, request, view):
        """
        Autoriza lectura a cualquier autenticado; escritura solo a roles permitidos.

        SAFE_METHODS (GET, HEAD, OPTIONS) siempre pasan aquí porque list/retrieve
        ya están abiertos a cualquier usuario autenticado en el ViewSet.
        """
        if request.method in SAFE_METHODS:
            return True

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in (User.Role.PROFESOR, User.Role.ADMIN, User.Role.DIRECTOR)
        )


class IsAdminOrDirectorForWrite(BasePermission):
    """
    Permite lectura a cualquier autenticado; solo Admin o Director
    pueden crear, editar o eliminar.

    Se usa en GeneroViewSet: a diferencia de Coreografia, el Profesor
    no gestiona el catálogo de géneros, solo lo consulta al crear/editar
    sus coreografías.
    """

    message = "Solo usuarios con rol Administrador o Director pueden gestionar géneros."  # noqa: E501

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (User.Role.ADMIN, User.Role.DIRECTOR)
        )


class IsOwnerOrAdminOrDirector(BasePermission):
    """
    Permite editar/eliminar una coreografía solo al profesor dueño
    o a un usuario con rol Administrador/Director.

    Se evalúa a nivel de objeto (has_object_permission), después de
    que has_permission ya validó autenticación y rol de creación.
    """

    message = "Solo el profesor dueño de la coreografía o un Admin/Director pueden editar o eliminar este recurso."  # noqa: E501

    def has_object_permission(self, request, view, obj):
        """
        Retorna True si el usuario es dueño del recurso o tiene rol de gestión.

        Lectura (SAFE_METHODS) siempre se permite aquí; la restricción
        real ocurre en update/partial_update/destroy.
        """
        if request.method in SAFE_METHODS:
            return True

        if request.user.role in (User.Role.ADMIN, User.Role.DIRECTOR):
            return True

        # obj.profesor puede ser None si el profesor original fue eliminado (SET_NULL)
        return obj.profesor_id == request.user.pk
