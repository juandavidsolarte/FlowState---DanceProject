"""
Vistas del dominio Catalog.

Expone el CRUD de Genero y Coreografia. El listado de coreografías
admite búsqueda por título y filtros por estado y género. La
creación y edición están restringidas por rol y propiedad del
recurso (ver apps.catalog.permissions).
"""

from django.http import JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Coreografia, Genero
from .permissions import (
    IsAdminOrDirectorForWrite,
    IsOwnerOrAdminOrDirector,
    IsProfesorOrAdmin,
)
from .serializers import (
    CoreografiaDetailSerializer,
    CoreografiaListSerializer,
    CoreografiaWriteSerializer,
    GeneroSerializer,
)


def ping(request):
    return JsonResponse({"status": "ok", "app": "catalog"})


class GeneroViewSet(viewsets.ModelViewSet):
    """
    CRUD del catálogo de géneros de baile.

    Lectura (list/retrieve) disponible para cualquier usuario autenticado.
    Creación, edición y eliminación restringidas a Admin/Director.
    """

    queryset = Genero.objects.all()
    serializer_class = GeneroSerializer
    permission_classes = [IsAuthenticated, IsAdminOrDirectorForWrite]
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre"]


class CoreografiaViewSet(viewsets.ModelViewSet):
    """
    CRUD de coreografías.

    - list/retrieve: cualquier usuario autenticado.
    - create: solo Profesor, Admin o Director (IsProfesorOrAdmin).
    - update/partial_update/destroy: solo el profesor dueño o Admin/Director
      (IsOwnerOrAdminOrDirector, evaluado a nivel de objeto).

    Filtros disponibles en el listado:
      - ?search=  → búsqueda parcial insensible a mayúsculas sobre el título
      - ?estado=  → borrador | publicado | archivado
      - ?genero=  → id del género
    """

    queryset = Coreografia.objects.select_related(
        "profesor", "genero"
    ).prefetch_related("videos")
    permission_classes = [IsAuthenticated, IsProfesorOrAdmin, IsOwnerOrAdminOrDirector]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["estado", "genero"]
    search_fields = ["titulo"]

    def get_serializer_class(self):
        """Elige el serializer según la acción: lista, detalle o escritura."""
        if self.action == "list":
            return CoreografiaListSerializer
        if self.action in ("create", "update", "partial_update"):
            return CoreografiaWriteSerializer
        return CoreografiaDetailSerializer

    def perform_create(self, serializer):
        """Asigna automáticamente al usuario autenticado como profesor dueño."""
        serializer.save(profesor=self.request.user)
