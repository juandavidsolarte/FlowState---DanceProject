"""
Validación de filtros de fecha para los endpoints del dashboard.

Todas las vistas del dashboard aceptan los mismos query params opcionales
(`fecha_desde`, `fecha_hasta`) y deben aplicar las mismas reglas de
validación, así que la lógica se centraliza aquí para no duplicarla.
"""

from datetime import datetime

from rest_framework.exceptions import ValidationError

FORMATO_FECHA = "%Y-%m-%d"
RANGO_MAXIMO_DIAS = 366  # ~1 año; 366 para no penalizar años bisiestos


def validar_rango_fechas(request):
    """
    Lee y valida los query params `fecha_desde` y `fecha_hasta` del request.

    Ambos son opcionales e independientes entre sí. Si se envían los dos,
    se valida que `fecha_desde` sea anterior a `fecha_hasta` y que el
    rango entre ambas no supere 1 año.

    Args:
        request: request de DRF (usa request.query_params).

    Returns:
        tuple(date | None, date | None): (fecha_desde, fecha_hasta). Si
        ninguno de los dos parámetros llega en la request, retorna
        (None, None) y la vista que llama no debe filtrar por fecha.

    Raises:
        rest_framework.exceptions.ValidationError: si el formato de alguna
        fecha es inválido, si fecha_desde no es anterior a fecha_hasta, o
        si el rango solicitado supera 1 año. DRF convierte automáticamente
        esta excepción en una respuesta 400.
    """
    fecha_desde_str = request.query_params.get("fecha_desde")
    fecha_hasta_str = request.query_params.get("fecha_hasta")

    if not fecha_desde_str and not fecha_hasta_str:
        return None, None

    fecha_desde = _parsear_fecha(fecha_desde_str) if fecha_desde_str else None
    fecha_hasta = _parsear_fecha(fecha_hasta_str) if fecha_hasta_str else None

    if fecha_desde and fecha_hasta:
        if fecha_desde >= fecha_hasta:
            raise ValidationError(
                {"error": "fecha_desde debe ser anterior a fecha_hasta."}
            )
        if (fecha_hasta - fecha_desde).days > RANGO_MAXIMO_DIAS:
            raise ValidationError(
                {"error": "El rango de fechas no puede superar 1 año."}
            )

    return fecha_desde, fecha_hasta


def _parsear_fecha(valor):
    """
    Convierte un string 'YYYY-MM-DD' en un objeto date.

    Lanza ValidationError (en vez de dejar propagar el ValueError de
    strptime) para que el error llegue al cliente como un 400 con un
    mensaje claro, en vez de un 500 genérico.
    """
    try:
        return datetime.strptime(valor, FORMATO_FECHA).date()
    except (ValueError, TypeError):
        raise ValidationError({"error": "Formato de fecha inválido, usa YYYY-MM-DD."})
