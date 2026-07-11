"""
Serializers del dominio Catalog.

Define la serialización de Genero, Coreografia y Video en sus
distintas variantes: lista resumida, detalle completo y escritura
(creación/edición) con sus validaciones correspondientes.
"""

from rest_framework import serializers

from .models import Coreografia, Genero, Video


class GeneroSerializer(serializers.ModelSerializer):
    """
    Serializa el catálogo de géneros de baile.

    Usado en /api/v1/generos/ para listar, crear, editar y eliminar géneros.
    """

    class Meta:
        model = Genero
        fields = ["id", "nombre", "descripcion"]


class VideoSerializer(serializers.ModelSerializer):
    """
    Serializa un video individual dentro de una coreografía.

    Se anida dentro de CoreografiaDetailSerializer para mostrar
    todas las partes de una coreografía en la vista de detalle.
    """

    class Meta:
        model = Video
        fields = ["id", "url", "duracion_segundos", "orden"]


class CoreografiaListSerializer(serializers.ModelSerializer):
    """
    Versión resumida de Coreografia para el endpoint de listado.

    Solo incluye los campos necesarios para tarjetas de catálogo,
    evitando enviar descripción larga o videos anidados.
    """

    genero = serializers.StringRelatedField()  # Muestra el nombre en vez del id

    class Meta:
        model = Coreografia
        fields = [
            "id",
            "titulo",
            "genero",
            "nivel",
            "precio",
            "estado",
            "thumbnail_url",
        ]


class CoreografiaDetailSerializer(serializers.ModelSerializer):
    """
    Versión completa de Coreografia para el endpoint de detalle.

    Incluye todos los campos del modelo más los videos anidados
    (solo lectura) y el nombre del género y del profesor para
    evitar que el cliente frontend tenga que resolver IDs.
    """

    genero = GeneroSerializer(read_only=True)
    videos = VideoSerializer(many=True, read_only=True)
    profesor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Coreografia
        fields = [
            "id",
            "titulo",
            "descripcion",
            "profesor",
            "profesor_nombre",
            "genero",
            "nivel",
            "precio",
            "video_url",
            "thumbnail_url",
            "estado",
            "duracion_segundos",
            "videos",
            "created_at",
            "updated_at",
        ]

    def get_profesor_nombre(self, obj):
        """Retorna el nombre completo del profesor, o None si fue dado de baja."""
        if obj.profesor is None:
            return None
        return f"{obj.profesor.first_name} {obj.profesor.last_name}"


class CoreografiaWriteSerializer(serializers.ModelSerializer):
    """
    Serializer de escritura para crear y editar coreografías.

    El campo `profesor` no se expone aquí: la vista lo asigna
    automáticamente desde request.user al crear, para que un
    profesor no pueda asignar la coreografía a otro usuario.
    """

    class Meta:
        model = Coreografia
        fields = [
            "id",
            "titulo",
            "descripcion",
            "genero",
            "nivel",
            "precio",
            "video_url",
            "thumbnail_url",
            "estado",
            "duracion_segundos",
        ]
        read_only_fields = ["id"]

    def validate_precio(self, value):
        """El precio de venta debe ser siempre positivo."""
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a 0.")
        return value
