from django.contrib import admin

from .models import Coreografia, Genero, Video


@admin.register(Genero)
class GeneroAdmin(admin.ModelAdmin):
    list_display = ("nombre",)
    search_fields = ("nombre",)


@admin.register(Coreografia)
class CoreografiaAdmin(admin.ModelAdmin):
    list_display = ("titulo", "profesor", "genero", "nivel", "precio", "estado")
    list_filter = ("estado", "nivel", "genero")
    search_fields = ("titulo", "descripcion")
    raw_id_fields = ("profesor",)


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("coreografia", "orden", "duracion_segundos")
    list_filter = ("coreografia",)
    ordering = ("coreografia", "orden")
