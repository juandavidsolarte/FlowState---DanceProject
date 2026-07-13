from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "catalog"

router = DefaultRouter()
router.register(r"generos", views.GeneroViewSet, basename="genero")
router.register(r"coreografias", views.CoreografiaViewSet, basename="coreografia")

urlpatterns = [
    path("ping/", views.ping, name="ping"),
    # Catálogo público para clientes (SCRUM-31) — distinto de /coreografias/,
    # que es el CRUD interno para Admin/Profesor/Director.
    path("catalogo/", views.CatalogoListView.as_view(), name="catalogo-list"),
    path(
        "catalogo/<int:pk>/", views.CatalogoDetailView.as_view(), name="catalogo-detail"
    ),
    path("", include(router.urls)),
]
