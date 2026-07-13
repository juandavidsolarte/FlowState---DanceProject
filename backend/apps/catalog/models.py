"""
Módulo de modelos del dominio Catalog.

Define los modelos Coreografia y Video que representan el catálogo
de contenido de la academia. Cada coreografía pertenece a un profesor
y puede tener uno o más videos asociados ordenados por el campo `orden`.
"""

from django.conf import settings
from django.db import models


class Genero(models.Model):
    """
    Catálogo controlado de géneros de baile (salsa, bachata, etc.).

    Reemplaza el campo de texto libre que tenía Coreografia por una
    relación FK, evitando duplicados por variaciones de escritura
    (ej. "Salsa" vs "salsa" vs "SALSA").
    """

    nombre = models.CharField(max_length=100, unique=True)  # Ej. "Salsa", "Bachata"
    descripcion = models.TextField(blank=True)  # Detalle opcional del género

    class Meta:
        db_table = "catalog_genero"
        verbose_name = "Género"
        verbose_name_plural = "Géneros"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Coreografia(models.Model):
    """
    Producto principal del catálogo: una coreografía que los clientes pueden comprar.

    El ciclo de vida es: borrador → publicado → archivado.
    Solo las coreografías con estado PUBLICADO son visibles y comprables por clientes.
    Si un profesor se elimina del sistema, la coreografía se conserva (SET_NULL).
    """

    class Nivel(models.TextChoices):
        PRINCIPIANTE = "principiante", "Principiante"
        INTERMEDIO = "intermedio", "Intermedio"
        AVANZADO = "avanzado", "Avanzado"

    class Estado(models.TextChoices):
        BORRADOR = "borrador", "Borrador"
        PUBLICADO = "publicado", "Publicado"
        ARCHIVADO = "archivado", "Archivado"

    titulo = models.CharField(max_length=255)  # Nombre público que ve el cliente
    descripcion = models.TextField(
        blank=True
    )  # Texto largo para la vista de detalle, opcional
    # SET_NULL: la coreografía se conserva aunque el profesor sea dado de baja
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coreografias",
    )
    # SET_NULL: si se borra el género, la coreografía se conserva sin clasificar
    genero = models.ForeignKey(
        Genero,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coreografias",
    )
    nivel = models.CharField(
        max_length=20, choices=Nivel.choices, default=Nivel.PRINCIPIANTE
    )  # Determina la audiencia objetivo de la coreografía
    precio = models.DecimalField(
        max_digits=10, decimal_places=2
    )  # Precio de venta en COP al publicar
    video_url = models.CharField(
        max_length=500, blank=True
    )  # URL pública del video en Supabase Storage
    thumbnail_url = models.CharField(
        max_length=500, blank=True
    )  # Miniatura para la tarjeta del catálogo
    estado = models.CharField(
        max_length=20, choices=Estado.choices, default=Estado.BORRADOR
    )  # Controla visibilidad: solo PUBLICADO es accesible para clientes
    duracion_segundos = models.PositiveIntegerField(
        default=0
    )  # Duración total del video principal
    preview_segundos = models.IntegerField(
        default=30
    )  # Segundos de preview gratuito para clientes que no compraron
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_coreografia"
        verbose_name = "Coreografía"
        verbose_name_plural = "Coreografías"
        ordering = ["-created_at"]
        # Índices para acelerar los filtros del catálogo público (SCRUM-31):
        # listar por estado=publicado, y filtrar/ordenar por nivel, precio y género.
        indexes = [
            models.Index(fields=["estado"]),
            models.Index(fields=["nivel"]),
            models.Index(fields=["precio"]),
            models.Index(fields=["genero"]),
        ]

    def __str__(self):
        return f"{self.titulo} ({self.get_nivel_display()})"


class Video(models.Model):
    """
    Video individual dentro de una coreografía.

    Una coreografía puede dividirse en múltiples partes (intro, desarrollo, práctica).
    El campo `orden` define la secuencia de reproducción; se ordena ascendente.
    La URL apunta al archivo en Supabase Storage — el binario no vive en el servidor.
    """

    # CASCADE: si se elimina la coreografía, sus videos se eliminan también
    coreografia = models.ForeignKey(
        Coreografia,
        on_delete=models.CASCADE,
        related_name="videos",
    )
    url = models.CharField(max_length=500)  # URL pública del video en Supabase Storage
    duracion_segundos = models.PositiveIntegerField(
        default=0
    )  # Duración de esta parte específica
    orden = models.PositiveSmallIntegerField(
        default=1
    )  # Posición en la secuencia de reproducción

    class Meta:
        db_table = "catalog_video"
        verbose_name = "Video"
        verbose_name_plural = "Videos"
        ordering = ["orden"]

    def __str__(self):
        return f"Video #{self.orden} — {self.coreografia.titulo}"
