from django.contrib import admin

from .models import Carrito, CarritoItem, Compra


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "cliente",
        "coreografia",
        "precio_pagado",
        "estado",
        "fecha_compra",
    )
    list_filter = ("estado", "metodo_pago")
    search_fields = ("cliente__email", "coreografia__titulo")
    raw_id_fields = ("cliente", "coreografia")
    readonly_fields = ("fecha_compra",)


class CarritoItemInline(admin.TabularInline):
    model = CarritoItem
    extra = 0
    raw_id_fields = ("coreografia",)
    readonly_fields = ("agregado_en",)


@admin.register(Carrito)
class CarritoAdmin(admin.ModelAdmin):
    list_display = ("pk", "cliente", "session_id", "creado_en", "actualizado_en")
    search_fields = ("cliente__email", "session_id")
    raw_id_fields = ("cliente",)
    readonly_fields = ("creado_en", "actualizado_en")
    inlines = [CarritoItemInline]
