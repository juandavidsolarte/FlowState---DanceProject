"""
Módulo de servicios externos del dominio Users.

Contiene la integración con Supabase Storage para el almacenamiento
de avatares de usuario. Centraliza la comunicación con el cliente
externo para que las vistas y serializers no dependan directamente
de la API de Supabase.

Supabase Storage funciona como un servicio de archivos en la nube
(similar a AWS S3). Los archivos subidos son accesibles públicamente
mediante una URL permanente.
"""

import os
import uuid

from django.conf import settings
from supabase import Client, create_client


def _get_client() -> Client:
    """
    Crea y retorna un cliente autenticado de Supabase.

    Lee las credenciales desde las variables de entorno del proyecto.
    Si no están definidas, falla rápido con un error descriptivo para
    que el desarrollador sepa qué configurar en el .env.

    Returns:
        Client: instancia del cliente Supabase lista para operar.

    Raises:
        EnvironmentError: si SUPABASE_URL o SUPABASE_KEY no están
            definidas en el archivo .env.
    """
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    if not url or not key:
        raise EnvironmentError(
            "SUPABASE_URL y SUPABASE_KEY deben estar definidas "
            "en las variables de entorno."
        )
    return create_client(url, key)


class SupabaseService:
    """
    Servicio para subir archivos al bucket de avatares en Supabase.

    Agrupa las operaciones de Storage en un solo lugar para que el
    resto del código (serializers, vistas) solo llame métodos simples
    sin saber cómo funciona Supabase internamente.
    """

    @staticmethod
    def upload_avatar(file, original_filename: str) -> str:
        """
        Sube una imagen de perfil al bucket de avatares.

        Genera un nombre único con UUID para cada archivo antes de
        subirlo. UUID (Universally Unique Identifier) es un ID de
        32 dígitos hexadecimales que garantiza que dos usuarios que
        suban 'foto.jpg' no se sobreescriban entre sí.

        Args:
            file: objeto de imagen de Django (InMemoryUploadedFile).
                Tiene el método .read() para leer los bytes.
            original_filename (str): nombre original para conservar
                la extensión (.jpg, .png, .webp).

        Returns:
            str: URL pública del avatar subido, lista para guardar
                en User.avatar_url y mostrar en el frontend.

        Raises:
            Exception: si Supabase rechaza el upload por red,
                permisos u otro motivo.
        """
        client = _get_client()
        # Nombre del bucket definido en settings (default: 'avatars')
        bucket = settings.SUPABASE_BUCKET

        # Extraemos la extensión del archivo original
        ext = os.path.splitext(original_filename)[1].lower()

        # Ruta única dentro del bucket: avatars/<uuid_sin_guiones>.jpg
        # uuid4() genera un UUID aleatorio; .hex elimina los guiones.
        unique_name = f"avatars/{uuid.uuid4().hex}{ext}"

        file_bytes = file.read()

        # Supabase necesita el content-type para servir el archivo con
        # los headers HTTP correctos — así el browser sabe que es imagen.
        content_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }
        content_type = content_type_map.get(ext, "application/octet-stream")

        client.storage.from_(bucket).upload(
            path=unique_name,
            file=file_bytes,
            file_options={"content-type": content_type},
        )

        # get_public_url retorna la URL que el frontend usa directamente
        # en el atributo src de la etiqueta <img>.
        public_url = client.storage.from_(bucket).get_public_url(unique_name)
        return public_url

# apps/users/services.py
from django.conf import settings
import requests

def verify_recaptcha(recaptcha_response):
    #   DEVOLVER TRUE SI ES DEV
    if settings.DEBUG: 
        return True
    data = {
        'secret': settings.RECAPTCHA_SECRET_KEY,
        'response': recaptcha_response
    }
    r = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
    result = r.json()
    return result.get('success', False)