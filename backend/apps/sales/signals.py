"""
Señales del dominio Sales.

Define la señal `checkout_exitoso` que se dispara cada vez que una orden
se completa con éxito. Permite desacoplar el envío de email de la vista
de checkout — la vista dispara la señal y los handlers se encargan del resto.
"""

from django.dispatch import Signal, receiver

# Señal personalizada: se emite cuando una orden se completa exitosamente.
# Argumentos: sender (clase), orden (instancia de Orden), request (WSGIRequest)
checkout_exitoso = Signal()


@receiver(checkout_exitoso)
def enviar_email_confirmacion(sender, orden, request, **kwargs):
    """
    Handler que simula el envío de email de confirmación al cliente.

    En producción real aquí iría la integración con SendGrid u otro proveedor.
    Por ahora hace un print / logging para que sea verificable en los tests y
    en la consola del servidor sin requerir configuración de SMTP.
    """
    import logging

    logger = logging.getLogger(__name__)
    logger.info(
        "Email de confirmación simulado → %s | Orden #%s | Total: $%s",
        orden.cliente.email,
        orden.pk,
        orden.total,
    )
