"""
Filtros del catálogo público de coreografías (SCRUM-31).

CatalogoFilter se usa en CatalogoListView para que el cliente pueda
combinar filtros de género, nivel y rango de precio en la URL,
ej. /api/v1/catalogo/?genero=salsa&nivel=avanzado&precio_min=20000.
"""

import django_filters

from .models import Coreografia


class CatalogoFilter(django_filters.FilterSet):
    """
    Filtro para el listado público del catálogo.

    - genero: coincide con el nombre del género, insensible a mayúsculas.
    - nivel: coincide con el valor del choice, insensible a mayúsculas.
    - precio_min / precio_max: acotan el rango de precio (inclusive).
    """

    genero = django_filters.CharFilter(
        field_name="genero__nombre", lookup_expr="iexact"
    )
    nivel = django_filters.CharFilter(lookup_expr="iexact")
    precio_min = django_filters.NumberFilter(field_name="precio", lookup_expr="gte")
    precio_max = django_filters.NumberFilter(field_name="precio", lookup_expr="lte")

    class Meta:
        model = Coreografia
        fields = ["genero", "nivel", "precio_min", "precio_max"]
