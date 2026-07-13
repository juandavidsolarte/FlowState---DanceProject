from django.urls import path

from .views import (CarritoDetailView, CarritoItemCreateView,
                    CarritoItemDeleteView, CarritoMergeView,
                    CheckoutIniciarView, CheckoutProcesarView,
                    CompraDetailView, FacturaPDFView, PurchaseHistoryView)

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
    path("carrito/", CarritoDetailView.as_view(), name="carrito-detail"),
    path("carrito/items/", CarritoItemCreateView.as_view(), name="carrito-item-create"),
    path(
        "carrito/items/<int:coreografia_id>/",
        CarritoItemDeleteView.as_view(),
        name="carrito-item-delete",
    ),
    path("carrito/merge/", CarritoMergeView.as_view(), name="carrito-merge"),
    path("checkout/iniciar/", CheckoutIniciarView.as_view(), name="checkout-iniciar"),
    path(
        "checkout/procesar/", CheckoutProcesarView.as_view(), name="checkout-procesar"
    ),
]
