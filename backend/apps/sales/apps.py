from django.apps import AppConfig


class SalesConfig(AppConfig):
    """Configuración de la app Sales. Carga las señales al iniciar Django."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.sales"

    def ready(self):
        """Importa las señales para que los @receiver se registren al arrancar."""
        import apps.sales.signals  # noqa: F401
