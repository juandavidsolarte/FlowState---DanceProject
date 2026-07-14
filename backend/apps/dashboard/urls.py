from django.urls import path

from .views import (KpisGeneralesView, TopClientesView, VentasMensualesView,
                    VentasPorGeneroView)

app_name = "dashboard"

urlpatterns = [
    path("dashboard/kpis/", KpisGeneralesView.as_view(), name="dashboard-kpis"),
    path(
        "dashboard/ventas-mensuales/",
        VentasMensualesView.as_view(),
        name="dashboard-ventas-mensuales",
    ),
    path(
        "dashboard/ventas-por-genero/",
        VentasPorGeneroView.as_view(),
        name="dashboard-ventas-por-genero",
    ),
    path(
        "dashboard/top-clientes/",
        TopClientesView.as_view(),
        name="dashboard-top-clientes",
    ),
]
