from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "catalog"

router = DefaultRouter()
router.register(r"generos", views.GeneroViewSet, basename="genero")
router.register(r"coreografias", views.CoreografiaViewSet, basename="coreografia")

urlpatterns = [
    path("ping/", views.ping, name="ping"),
    path("", include(router.urls)),
]
