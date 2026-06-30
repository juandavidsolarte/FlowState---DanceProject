"""
Módulo de modelos del dominio Sales.

Define el modelo Compra que registra cada transacción entre un cliente
y una coreografía del catálogo. El estado controla el ciclo de vida
de la compra (pendiente → activa → cancelada/reembolsada).
"""

from django.conf import settings
from django.db import models

from apps.catalog.models import Coreografia


class Compra(models.Model):
    """
    Registro de una transacción de compra entre un cliente y una coreografía.

    Una compra con estado ACTIVA es la que habilita al cliente a ver los videos
    de la coreografía. Se usa PROTECT en ambas FK para evitar borrar accidentalmente
    un usuario o coreografía que tenga historial de ventas asociado.
    """

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"  # Pago iniciado pero no confirmado
        ACTIVA = "activa", "Activa"  # Pago confirmado, cliente tiene acceso
        CANCELADA = "cancelada", "Cancelada"  # Cancelada antes de activarse
        REEMBOLSADA = "reembolsada", "Reembolsada"  # Pago devuelto al cliente

    class MetodoPago(models.TextChoices):
        TARJETA = "tarjeta", "Tarjeta de crédito/débito"
        TRANSFERENCIA = "transferencia", "Transferencia bancaria"
        EFECTIVO = "efectivo", "Efectivo"
        OTRO = "otro", "Otro"

    # PROTECT: impide eliminar un usuario que tenga compras registradas
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="compras",
    )
    # PROTECT: impide eliminar una coreografía que ya fue vendida
    coreografia = models.ForeignKey(
        Coreografia,
        on_delete=models.PROTECT,
        related_name="compras",
    )
    precio_pagado = models.DecimalField(
        max_digits=10, decimal_places=2
    )  # Precio al momento de la compra; puede diferir del precio actual de la coreografía  # noqa: E501
    estado = models.CharField(
        max_length=20, choices=Estado.choices, default=Estado.PENDIENTE
    )  # Estado del ciclo de vida de la transacción
    fecha_compra = models.DateTimeField(
        auto_now_add=True
    )  # Timestamp inmutable del momento de la transacción
    metodo_pago = models.CharField(
        max_length=20, choices=MetodoPago.choices, default=MetodoPago.TARJETA
    )  # Canal de pago usado, relevante para reportes y auditoría

    class Meta:
        db_table = "sales_compra"
        verbose_name = "Compra"
        verbose_name_plural = "Compras"
        ordering = ["-fecha_compra"]

    def __str__(self):
        return f"Compra #{self.pk} — {self.cliente.email} → {self.coreografia.titulo}"
