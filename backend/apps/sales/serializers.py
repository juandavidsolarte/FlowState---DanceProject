"""
Serializers del dominio Sales.

La jerarquía de anidamiento es:
    CompraSerializer
      └── CoreografiaSerializer
            └── VideoSerializer

Todos son de solo lectura: el historial se consulta, no se modifica desde esta API.
"""

from decimal import Decimal

from rest_framework import serializers

from apps.catalog.models import Coreografia, Video
from apps.sales.models import Carrito, CarritoItem, Compra

IVA_PORCENTAJE = Decimal("0.19")  # IVA vigente en Colombia para servicios digitales


class VideoSerializer(serializers.ModelSerializer):
    """
    Serializa los datos básicos de un video.
    Usado como campo anidado dentro de CoreografiaSerializer.
    No expone la URL al nivel raíz para no mezclar responsabilidades.
    """

    class Meta:
        model = Video
        fields = ["id", "url", "duracion_segundos", "orden"]


class CoreografiaSerializer(serializers.ModelSerializer):
    """
    Serializa los datos de una coreografía para mostrarla en el historial de compras.
    Usado en GET /api/v1/clientes/me/compras/ (anidado dentro de CompraSerializer).
    Incluye la lista completa de videos asociados.
    """

    videos = VideoSerializer(many=True, read_only=True)
    # Desde SCRUM-30 genero es FK a Genero: exponemos el nombre como string
    # plano para no romper el contrato existente con el frontend.
    genero = serializers.StringRelatedField()
    # *_display: etiqueta legible del choice para mostrar en el frontend
    # (ej. "Avanzado" en vez del valor guardado en BD "avanzado")
    nivel_display = serializers.CharField(source="get_nivel_display", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = Coreografia
        fields = [
            "id",
            "titulo",
            "descripcion",
            "genero",
            "nivel",
            "nivel_display",
            "estado",
            "estado_display",
            "precio",
            "thumbnail_url",
            "duracion_segundos",
            "videos",
        ]


class CompraSerializer(serializers.ModelSerializer):
    """
    Serializa el historial de compras de un cliente.
    Usado en GET /api/v1/clientes/me/compras/ y GET /api/v1/clientes/me/compras/{id}/.
    Anida CoreografiaSerializer para que el frontend reciba todo en una sola respuesta
    sin necesidad de hacer llamadas adicionales al catálogo.
    """

    coreografia = CoreografiaSerializer(read_only=True)
    # *_display: etiqueta legible del choice para mostrar en el frontend
    # (ej. "Activa" en vez del valor guardado en BD "activa")
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    metodo_pago_display = serializers.CharField(
        source="get_metodo_pago_display", read_only=True
    )

    class Meta:
        model = Compra
        fields = [
            "id",
            "fecha_compra",
            "precio_pagado",
            "estado",
            "estado_display",
            "metodo_pago",
            "metodo_pago_display",
            "coreografia",
        ]


class CarritoItemSerializer(serializers.ModelSerializer):
    """
    Serializa un ítem del carrito junto a los datos públicos de su
    coreografía (los necesarios para mostrar la tarjeta en el carrito
    del frontend: título, precio, miniatura y género).
    """

    coreografia_id = serializers.IntegerField(source="coreografia.id", read_only=True)
    titulo = serializers.CharField(source="coreografia.titulo", read_only=True)
    precio = serializers.DecimalField(
        source="coreografia.precio", max_digits=10, decimal_places=2, read_only=True
    )
    thumbnail_url = serializers.CharField(
        source="coreografia.thumbnail_url", read_only=True
    )
    genero = serializers.StringRelatedField(source="coreografia.genero")

    class Meta:
        model = CarritoItem
        fields = [
            "id",
            "coreografia_id",
            "titulo",
            "precio",
            "thumbnail_url",
            "genero",
            "agregado_en",
        ]


class CarritoSerializer(serializers.ModelSerializer):
    """
    Serializa el carrito completo: sus items más los totales calculados.

    Los items deben venir precargados con select_related/prefetch_related
    desde la vista (ver apps.sales.views._carrito_queryset) para que
    calcular subtotal/iva/total no dispare queries adicionales.
    """

    items = CarritoItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    iva_monto = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Carrito
        fields = ["id", "items", "subtotal", "iva_monto", "total"]

    def _calcular_subtotal(self, obj):
        """Suma el precio de todas las coreografías en el carrito."""
        return sum(
            (item.coreografia.precio for item in obj.items.all()), Decimal("0.00")
        )

    def _calcular_iva(self, obj):
        """Calcula el IVA (19%) sobre el subtotal."""
        return (self._calcular_subtotal(obj) * IVA_PORCENTAJE).quantize(Decimal("0.01"))

    def get_subtotal(self, obj):
        # str(): SerializerMethodField no pasa por DecimalField.to_representation,
        # así que sin esto se serializaría como float y perdería precisión monetaria.
        return str(self._calcular_subtotal(obj))

    def get_iva_monto(self, obj):
        return str(self._calcular_iva(obj))

    def get_total(self, obj):
        """Subtotal + IVA: el monto final a pagar en el checkout."""
        return str(self._calcular_subtotal(obj) + self._calcular_iva(obj))
