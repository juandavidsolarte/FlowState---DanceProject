import uuid
import os
from django.conf import settings
from supabase import create_client, Client


def _get_client() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    if not url or not key:
        raise EnvironmentError(
            "SUPABASE_URL y SUPABASE_KEY deben estar definidas "
            "en las variables de entorno."
        )
    return create_client(url, key)


class SupabaseService:
    """Servicio para operaciones con Supabase Storage."""

    @staticmethod
    def upload_avatar(file, original_filename: str) -> str:
        """
        Sube un archivo de imagen al bucket de avatares.

        Genera un nombre único para evitar colisiones, sube el archivo
        y retorna la URL pública de acceso.

        Args:
            file: Objeto de archivo con atributo .read()
                (InMemoryUploadedFile).
            original_filename: Nombre original del archivo para
                preservar la extensión.

        Returns:
            URL pública (str) de la imagen subida.

        Raises:
            Exception: Si el upload a Supabase falla.
        """
        client = _get_client()
        bucket = settings.SUPABASE_BUCKET

        ext = os.path.splitext(original_filename)[1].lower()
        unique_name = f"avatars/{uuid.uuid4().hex}{ext}"

        file_bytes = file.read()
        content_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
        }
        content_type = content_type_map.get(ext, 'application/octet-stream')

        client.storage.from_(bucket).upload(
            path=unique_name,
            file=file_bytes,
            file_options={"content-type": content_type},
        )

        public_url = client.storage.from_(bucket).get_public_url(unique_name)
        return public_url
