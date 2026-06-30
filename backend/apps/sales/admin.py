from django.contrib import admin

from .models import Compra


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
