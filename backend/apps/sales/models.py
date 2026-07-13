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


class Carrito(models.Model):
    """
    Carrito de compras de un cliente autenticado o de un visitante anónimo.

    Puede pertenecer a un usuario logueado (`cliente`) o identificarse solo
    por `session_id` (visitante anónimo antes de iniciar sesión). Nunca
    ambos a la vez en la práctica: al hacer login se hace merge y el
    carrito anónimo se elimina (ver CarritoMergeView).
    """

    # OneToOneField (en vez de ForeignKey) garantiza un solo carrito por
    # cliente a nivel de base de datos. null=True permite carritos
    # anónimos, que siempre tienen cliente=None.
    cliente = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="carrito",
    )
    # Igual que cliente: unique=True asegura un solo carrito activo por
    # sesión anónima. Se envía desde el frontend vía header X-Session-ID.
    session_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    creado_en = models.DateTimeField(
        auto_now_add=True
    )  # Momento de creación del carrito
    actualizado_en = models.DateTimeField(
        auto_now=True
    )  # Se actualiza cada vez que se agrega/elimina un item

    class Meta:
        db_table = "sales_carrito"
        verbose_name = "Carrito"
        verbose_name_plural = "Carritos"
        ordering = ["-actualizado_en"]

    def __str__(self):
        propietario = (
            self.cliente.email if self.cliente else f"sesión {self.session_id}"
        )
        return f"Carrito #{self.pk} — {propietario}"


class CarritoItem(models.Model):
    """
    Una coreografía agregada a un carrito.

    unique_together evita que la misma coreografía se agregue dos veces
    al mismo carrito (la vista de creación también valida esto de forma
    explícita para poder retornar un mensaje de error claro).
    """

    # CASCADE: si se elimina el carrito, sus items desaparecen con él
    carrito = models.ForeignKey(Carrito, on_delete=models.CASCADE, related_name="items")
    # CASCADE: si se elimina la coreografía del catálogo, ya no tiene sentido
    # mantenerla en carritos pendientes
    coreografia = models.ForeignKey(Coreografia, on_delete=models.CASCADE)
    agregado_en = models.DateTimeField(auto_now_add=True)  # Momento en que se agregó

    class Meta:
        db_table = "sales_carrito_item"
        verbose_name = "Ítem de carrito"
        verbose_name_plural = "Ítems de carrito"
        unique_together = [("carrito", "coreografia")]
        ordering = ["agregado_en"]

    def __str__(self):
        return f"{self.coreografia.titulo} en carrito #{self.carrito_id}"
