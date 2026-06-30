from django.urls import path

from .views import CompraDetailView, FacturaPDFView, PurchaseHistoryView

app_name = "sales"

urlpatterns = [
    path(
        "clientes/me/compras/",
        PurchaseHistoryView.as_view(),
        name="purchase-history",
    ),
    path(
        "clientes/me/compras/<int:pk>/",
        CompraDetailView.as_view(),
        name="purchase-detail",
    ),
    path(
        "clientes/me/compras/<int:pk>/factura/",
        FacturaPDFView.as_view(),
        name="purchase-invoice",
    ),
]
