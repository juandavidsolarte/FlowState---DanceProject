"""
Serializers del dominio Dashboard.

Todos son `serializers.Serializer` planos (no ModelSerializer): las vistas
retornan datos ya agregados con `aggregate()`/`annotate()` — diccionarios,
no instancias de modelo — por lo que no hay un `Meta.model` al que mapear.
Solo se usan para estructurar y validar el formato de salida.
"""

from rest_framework import serializers


class KpisGeneralesSerializer(serializers.Serializer):
    """
    Serializa los KPIs generales de ventas.
    Usado en GET /api/v1/dashboard/kpis/.
    """

    total_ventas = serializers.CharField()  # str: precisión monetaria, evita floats
    total_transacciones = serializers.IntegerField()
    ticket_promedio = serializers.CharField()
    total_clientes_unicos = serializers.IntegerField()


class VentaMensualSerializer(serializers.Serializer):
    """
    Serializa un punto de la serie de ventas mensuales.
    Usado en GET /api/v1/dashboard/ventas-mensuales/.
    """

    mes = serializers.CharField()  # Formato "YYYY-MM"
    total_ventas = serializers.CharField()
    cantidad_ventas = serializers.IntegerField()


class VentaPorGeneroSerializer(serializers.Serializer):
    """
    Serializa un punto de la distribución de ventas por género de baile.
    Usado en GET /api/v1/dashboard/ventas-por-genero/.
    """

    genero = serializers.CharField()  # "Sin género" si la coreografía no tiene genero
    total_ventas = serializers.CharField()
    cantidad_ventas = serializers.IntegerField()
    porcentaje = (
        serializers.CharField()
    )  # Porcentaje sobre el total general, 2 decimales  # noqa: E501


class TopClienteSerializer(serializers.Serializer):
    """
    Serializa un cliente dentro del ranking de top 5 clientes por gasto.
    Usado en GET /api/v1/dashboard/top-clientes/.
    """

    cliente_id = serializers.IntegerField()
    nombre = serializers.CharField()
    email = serializers.EmailField()
    total_gastado = serializers.CharField()
    cantidad_compras = serializers.IntegerField()
