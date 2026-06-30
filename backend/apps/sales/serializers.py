"""
Serializers del dominio Sales.

La jerarquía de anidamiento es:
    CompraSerializer
      └── CoreografiaSerializer
            └── VideoSerializer

Todos son de solo lectura: el historial se consulta, no se modifica desde esta API.
"""

from rest_framework import serializers

from apps.catalog.models import Coreografia, Video
from apps.sales.models import Compra


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
