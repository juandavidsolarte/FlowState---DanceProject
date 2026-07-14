"""
Vistas del dominio Dashboard.

Expone KPIs y reportes agregados de ventas para el panel administrativo
de Director/Admin. Todos los endpoints son de solo lectura: no crean ni
modifican datos, solo agregan información que ya existe en `apps.sales`
y `apps.catalog`.

Todas las agregaciones se hacen con `aggregate()`/`annotate()` de Django
(nunca iterando en Python) y cada respuesta se cachea 5 minutos con
`LocMemCache` (backend por defecto, no requiere configuración adicional)
para no recalcular las mismas agregaciones en cada request.
"""

import calendar
from decimal import Decimal

from django.core.cache import cache
from django.db.models import Avg, CharField, Count, DecimalField, F, Sum, Value
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.sales.models import Compra
from apps.users.permissions import IsDirectorOrAdmin

from .filters import validar_rango_fechas
from .serializers import (KpisGeneralesSerializer, TopClienteSerializer,
                          VentaMensualSerializer, VentaPorGeneroSerializer)

CACHE_TTL_SEGUNDOS = 300  # 5 minutos


def _restar_meses(fecha, meses):
    """
    Resta una cantidad de meses calendario a una fecha.

    No se usa python-dateutil porque no está en las dependencias del
    proyecto (`requirements/local.txt`): se calcula el año/mes destino
    manualmente y se ajusta el día si el mes resultante tiene menos días
    que el original (ej. 31 de agosto - 6 meses no puede caer en 31 de
    febrero, que no existe).
    """
    mes_index = fecha.month - 1 - meses
    anio = fecha.year + mes_index // 12
    mes = mes_index % 12 + 1
    dia = min(fecha.day, calendar.monthrange(anio, mes)[1])
    return fecha.replace(year=anio, month=mes, day=dia)


def _redondear(valor):
    """
    Normaliza un resultado numérico de una agregación a Decimal con 2 decimales.

    Sum/Avg sobre un DecimalField retornan Decimal en PostgreSQL, pero
    SQLite (usado en local/tests si no hay DB_NAME) puede devolver float.
    Pasar por str() antes de Decimal() evita imprecisiones del float.
    """
    return Decimal(str(valor)).quantize(Decimal("0.01"))


def _aplicar_filtro_fechas(queryset, fecha_desde, fecha_hasta):
    """Aplica los filtros de fecha_compra sobre el queryset, si vienen definidos."""
    if fecha_desde:
        queryset = queryset.filter(fecha_compra__date__gte=fecha_desde)
    if fecha_hasta:
        queryset = queryset.filter(fecha_compra__date__lte=fecha_hasta)
    return queryset


class KpisGeneralesView(APIView):
    """
    GET /api/v1/dashboard/kpis/

    Retorna los KPIs generales de ventas: total vendido, número de
    transacciones, ticket promedio y cantidad de clientes únicos. Solo
    considera compras con estado ACTIVA (la única que confirma una venta
    exitosa; se crea automáticamente en el checkout).

    Acceso: solo usuarios autenticados con rol Director o Administrador.
    Query params opcionales: fecha_desde, fecha_hasta (YYYY-MM-DD).

    Retorna 200 con los KPIs (en 0 si no hay compras en el rango), o 400
    si el rango de fechas es inválido.
    """

    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]

    def get(self, request):
        """Calcula (o recupera de caché) los KPIs generales y los retorna."""
        fecha_desde, fecha_hasta = validar_rango_fechas(request)

        cache_key = f"dashboard:kpis:{fecha_desde}:{fecha_hasta}"
        data = cache.get(cache_key)
        if data is None:
            queryset = _aplicar_filtro_fechas(
                Compra.objects.filter(estado=Compra.Estado.ACTIVA),
                fecha_desde,
                fecha_hasta,
            )

            agregados = queryset.aggregate(
                total_ventas=Coalesce(
                    Sum("precio_pagado"),
                    Value(Decimal("0.00")),
                    output_field=DecimalField(),
                ),
                total_transacciones=Count("id"),
                ticket_promedio=Coalesce(
                    Avg("precio_pagado"),
                    Value(Decimal("0.00")),
                    output_field=DecimalField(),
                ),
                total_clientes_unicos=Count("cliente", distinct=True),
            )

            data = {
                "total_ventas": str(_redondear(agregados["total_ventas"])),
                "total_transacciones": agregados["total_transacciones"],
                "ticket_promedio": str(_redondear(agregados["ticket_promedio"])),
                "total_clientes_unicos": agregados["total_clientes_unicos"],
            }
            cache.set(cache_key, data, CACHE_TTL_SEGUNDOS)

        return Response(KpisGeneralesSerializer(data).data)


class VentasMensualesView(APIView):
    """
    GET /api/v1/dashboard/ventas-mensuales/

    Retorna la serie de ventas agrupada por mes (total vendido y cantidad
    de ventas por mes), pensada para graficar la evolución de ventas en
    el tiempo. Solo considera compras con estado ACTIVA.

    Si no se envían fecha_desde/fecha_hasta, retorna por defecto los
    últimos 6 meses. Si se envían, respeta exactamente ese rango.

    Acceso: solo usuarios autenticados con rol Director o Administrador.
    Retorna 200 con la lista ordenada ascendente por mes, o 400 si el
    rango de fechas es inválido.
    """

    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]

    def get(self, request):
        """Calcula (o recupera de caché) la serie mensual y la retorna."""
        fecha_desde, fecha_hasta = validar_rango_fechas(request)

        cache_key = f"dashboard:ventas-mensuales:{fecha_desde}:{fecha_hasta}"
        data = cache.get(cache_key)
        if data is None:
            queryset = Compra.objects.filter(estado=Compra.Estado.ACTIVA)

            if fecha_desde or fecha_hasta:
                queryset = _aplicar_filtro_fechas(queryset, fecha_desde, fecha_hasta)
            else:
                # Sin filtro explícito: por defecto los últimos 6 meses
                fecha_corte = _restar_meses(timezone.now().date(), 6)
                queryset = queryset.filter(fecha_compra__date__gte=fecha_corte)

            resultados = (
                queryset.annotate(mes=TruncMonth("fecha_compra"))
                .values("mes")
                .annotate(
                    total_ventas=Coalesce(
                        Sum("precio_pagado"),
                        Value(Decimal("0.00")),
                        output_field=DecimalField(),
                    ),
                    cantidad_ventas=Count("id"),
                )
                .order_by("mes")
            )

            data = [
                {
                    "mes": punto["mes"].strftime("%Y-%m"),
                    "total_ventas": str(_redondear(punto["total_ventas"])),
                    "cantidad_ventas": punto["cantidad_ventas"],
                }
                for punto in resultados
            ]
            cache.set(cache_key, data, CACHE_TTL_SEGUNDOS)

        return Response(VentaMensualSerializer(data, many=True).data)


class VentasPorGeneroView(APIView):
    """
    GET /api/v1/dashboard/ventas-por-genero/

    Retorna la distribución de ventas por género de baile: total vendido,
    cantidad de ventas y porcentaje sobre el total general de todos los
    géneros. Las coreografías sin género asignado (genero=None) se
    agrupan bajo la etiqueta "Sin género". Solo considera compras con
    estado ACTIVA.

    Acceso: solo usuarios autenticados con rol Director o Administrador.
    Query params opcionales: fecha_desde, fecha_hasta (YYYY-MM-DD).
    Retorna 200 con la lista ordenada descendente por total vendido.
    """

    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]

    def get(self, request):
        """Calcula (o recupera de caché) la distribución por género y la retorna."""
        fecha_desde, fecha_hasta = validar_rango_fechas(request)

        cache_key = f"dashboard:ventas-por-genero:{fecha_desde}:{fecha_hasta}"
        data = cache.get(cache_key)
        if data is None:
            queryset = _aplicar_filtro_fechas(
                Compra.objects.filter(estado=Compra.Estado.ACTIVA),
                fecha_desde,
                fecha_hasta,
            )

            resultados = list(
                queryset.annotate(
                    nombre_genero=Coalesce(
                        F("coreografia__genero__nombre"),
                        Value("Sin género"),
                        output_field=CharField(),
                    )
                )
                .values("nombre_genero")
                .annotate(
                    total_ventas=Coalesce(
                        Sum("precio_pagado"),
                        Value(Decimal("0.00")),
                        output_field=DecimalField(),
                    ),
                    cantidad_ventas=Count("id"),
                )
                .order_by("-total_ventas")
            )

            totales = [_redondear(r["total_ventas"]) for r in resultados]
            total_general = sum(totales, Decimal("0.00"))

            data = []
            for r, total_genero in zip(resultados, totales):
                porcentaje = (
                    (total_genero / total_general * 100).quantize(Decimal("0.01"))
                    if total_general > 0
                    else Decimal("0.00")
                )
                data.append(
                    {
                        "genero": r["nombre_genero"],
                        "total_ventas": str(total_genero),
                        "cantidad_ventas": r["cantidad_ventas"],
                        "porcentaje": str(porcentaje),
                    }
                )
            cache.set(cache_key, data, CACHE_TTL_SEGUNDOS)

        return Response(VentaPorGeneroSerializer(data, many=True).data)


class TopClientesView(APIView):
    """
    GET /api/v1/dashboard/top-clientes/

    Retorna el ranking de los 5 clientes que más han gastado, con su
    nombre, email, total gastado y cantidad de compras. Solo considera
    compras con estado ACTIVA.

    Acceso: solo usuarios autenticados con rol Director o Administrador.
    Query params opcionales: fecha_desde, fecha_hasta (YYYY-MM-DD).
    Retorna 200 con la lista ordenada descendente por total gastado
    (máximo 5 resultados).
    """

    permission_classes = [IsAuthenticated, IsDirectorOrAdmin]

    def get(self, request):
        """Calcula (o recupera de caché) el top 5 de clientes y lo retorna."""
        fecha_desde, fecha_hasta = validar_rango_fechas(request)

        cache_key = f"dashboard:top-clientes:{fecha_desde}:{fecha_hasta}"
        data = cache.get(cache_key)
        if data is None:
            queryset = _aplicar_filtro_fechas(
                Compra.objects.filter(estado=Compra.Estado.ACTIVA),
                fecha_desde,
                fecha_hasta,
            )

            resultados = (
                queryset.values(
                    "cliente_id",
                    "cliente__first_name",
                    "cliente__last_name",
                    "cliente__email",
                )
                .annotate(
                    total_gastado=Coalesce(
                        Sum("precio_pagado"),
                        Value(Decimal("0.00")),
                        output_field=DecimalField(),
                    ),
                    cantidad_compras=Count("id"),
                )
                .order_by("-total_gastado")[:5]
            )

            data = [
                {
                    "cliente_id": r["cliente_id"],
                    # Se concatena aquí en vez de usar el property full_name
                    # del modelo User porque values() retorna dicts, no
                    # instancias de modelo.
                    "nombre": (
                        f"{r['cliente__first_name']} {r['cliente__last_name']}"
                    ).strip(),
                    "email": r["cliente__email"],
                    "total_gastado": str(_redondear(r["total_gastado"])),
                    "cantidad_compras": r["cantidad_compras"],
                }
                for r in resultados
            ]
            cache.set(cache_key, data, CACHE_TTL_SEGUNDOS)

        return Response(TopClienteSerializer(data, many=True).data)
