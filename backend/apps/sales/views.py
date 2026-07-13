"""
Vistas del dominio Sales.

Expone el historial de compras del cliente autenticado con filtros
por fecha y género, paginación de 10 resultados por página, y
generación de factura PDF con ReportLab.
"""

import io
import random
from datetime import datetime
from decimal import Decimal

from django.db import transaction
from django.db.models import Prefetch
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Coreografia

from .models import Carrito, CarritoItem, Compra, Orden, OrdenItem
from .serializers import (CarritoSerializer, CheckoutResumenSerializer,
                          CompraSerializer, OrdenSerializer)
from .signals import checkout_exitoso

IVA_PORCENTAJE = Decimal("0.19")  # IVA vigente en Colombia para servicios digitales


class CompraPagination(PageNumberPagination):
    """
    Paginación para el historial de compras: 10 por página por defecto.
    El cliente puede ajustar con ?page_size=N (máximo 50).
    """

    page_size = 10
    page_size_query_param = (
        "page_size"  # Parámetro opcional para sobrescribir el tamaño de página
    )
    max_page_size = 50  # Tope para evitar respuestas demasiado pesadas


class PurchaseHistoryView(APIView):
    """
    GET /api/v1/clientes/me/compras/

    Retorna el historial de compras del cliente autenticado, paginado (10/página).
    Solo accesible con JWT válido — cada cliente ve únicamente sus propias compras.

    Query params opcionales:
      - fecha_inicio: YYYY-MM-DD — límite inferior del rango de fechas
      - fecha_fin:    YYYY-MM-DD — límite superior (se incluye todo el día)
      - genero:       str        — género de la coreografía, insensible a mayúsculas
    """

    permission_classes = [IsAuthenticated]
    pagination_class = CompraPagination

    def get(self, request):
        """
        Lista las compras del usuario autenticado, aplicando filtros y paginación.

        Retorna 200 con lista paginada, o 400 si el formato de fecha es inválido.
        El filtro por cliente se aplica sobre request.user — nunca sobre un ID externo,
        para que un usuario no pueda ver compras ajenas.
        """
        # Filtramos por request.user para garantizar que cada cliente
        # solo pueda ver sus propias compras, nunca las de otros usuarios.
        # select_related y prefetch_related previenen queries N+1 al serializar.
        queryset = (
            Compra.objects.filter(cliente=request.user)
            .select_related("coreografia", "coreografia__profesor")
            .prefetch_related("coreografia__videos")
        )

        fecha_inicio = request.query_params.get("fecha_inicio")
        fecha_fin = request.query_params.get("fecha_fin")

        if fecha_inicio:
            try:
                dt_inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d")
                # make_aware convierte la fecha naive a la zona horaria del proyecto (Bogotá)  # noqa: E501
                dt_inicio = timezone.make_aware(dt_inicio)
                queryset = queryset.filter(fecha_compra__gte=dt_inicio)
            except ValueError:
                return Response(
                    {"error": "fecha_inicio debe tener formato YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if fecha_fin:
            try:
                dt_fin = datetime.strptime(fecha_fin, "%Y-%m-%d")
                # Ajustamos al final del día para incluir compras realizadas
                # en cualquier momento de la fecha límite, no solo a las 00:00
                dt_fin = timezone.make_aware(
                    dt_fin.replace(hour=23, minute=59, second=59)
                )
                queryset = queryset.filter(fecha_compra__lte=dt_fin)
            except ValueError:
                return Response(
                    {"error": "fecha_fin debe tener formato YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        genero = request.query_params.get("genero")
        if genero:
            # iexact: "Salsa", "SALSA" y "salsa" producen el mismo resultado.
            # Desde SCRUM-30 genero es FK a Genero, por eso se filtra por su nombre.
            queryset = queryset.filter(coreografia__genero__nombre__iexact=genero)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = CompraSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class CompraDetailView(APIView):
    """
    GET /api/v1/clientes/me/compras/{id}/

    Retorna el detalle completo de una compra específica del cliente autenticado.
    Un cliente no puede acceder al detalle de compras que no le pertenecen.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """
        Retorna los datos de la compra indicada por pk.

        Retorna 404 si la compra no existe, 403 si pertenece a otro cliente.
        El 403 tiene prioridad sobre exponer si el recurso existe o no.
        """
        try:
            compra = (
                Compra.objects.select_related("coreografia", "coreografia__profesor")
                .prefetch_related("coreografia__videos")
                .get(pk=pk)
            )
        except Compra.DoesNotExist:
            return Response(
                {"error": "Compra no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Comparamos IDs en lugar de objetos para evitar una query extra al modelo User
        if compra.cliente_id != request.user.pk:
            return Response(
                {"error": "No tienes permiso para ver esta compra."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CompraSerializer(compra)
        return Response(serializer.data)


class FacturaPDFView(APIView):
    """
    GET /api/v1/clientes/me/compras/{id}/factura/

    Genera y descarga la factura en PDF de una compra del cliente autenticado.
    Retorna el PDF como archivo adjunto (Content-Disposition: attachment).
    Un cliente no puede descargar facturas de compras ajenas.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """
        Genera el PDF con ReportLab y lo retorna con Content-Type: application/pdf.

        Retorna 404 si la compra no existe, 403 si pertenece a otro cliente,
        o 200 con el archivo PDF listo para descargar.
        """
        try:
            compra = Compra.objects.select_related(
                "cliente", "coreografia", "coreografia__profesor"
            ).get(pk=pk)
        except Compra.DoesNotExist:
            return Response(
                {"error": "Compra no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if compra.cliente_id != request.user.pk:
            return Response(
                {"error": "No tienes permiso para descargar esta factura."},
                status=status.HTTP_403_FORBIDDEN,
            )

        pdf_buffer = self._generar_pdf(compra)
        filename = f"factura_flowstate_{compra.pk}.pdf"

        response = HttpResponse(pdf_buffer.getvalue(), content_type="application/pdf")
        # attachment fuerza la descarga en el navegador en lugar de mostrarla inline
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    def _generar_pdf(self, compra):
        """
        Construye el PDF de la factura y lo retorna como un BytesIO listo para leer.

        Usa el motor Platypus de ReportLab: se define una lista de elementos
        (Paragraph, Table, Spacer) y doc.build() calcula el layout automáticamente.
        El buffer se rebobina al inicio (seek(0)) para que el caller pueda leerlo.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

        styles = getSampleStyleSheet()
        estilo_titulo = ParagraphStyle(
            "titulo",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=colors.HexColor("#1a1a2e"),
            spaceAfter=6,
        )
        estilo_subtitulo = ParagraphStyle(
            "subtitulo",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=colors.HexColor("#4a4a8a"),
            spaceAfter=4,
        )
        estilo_normal = styles["Normal"]

        elementos = []

        elementos.append(Paragraph("FlowState Dance Academy", estilo_titulo))
        elementos.append(Paragraph("Factura de Compra", estilo_subtitulo))
        elementos.append(Spacer(1, 0.4 * cm))

        fecha_formateada = compra.fecha_compra.strftime("%d/%m/%Y %H:%M")
        datos_factura = [
            ["N° Factura:", f"#{compra.pk:06d}"],
            ["Fecha de compra:", fecha_formateada],
            ["Estado:", compra.get_estado_display()],
            ["Método de pago:", compra.get_metodo_pago_display()],
        ]

        tabla_factura = Table(datos_factura, colWidths=[5 * cm, 10 * cm])
        tabla_factura.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    (
                        "ROWBACKGROUNDS",
                        (0, 0),
                        (-1, -1),
                        [colors.white, colors.HexColor("#f5f5f5")],
                    ),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        elementos.append(tabla_factura)
        elementos.append(Spacer(1, 0.6 * cm))

        elementos.append(Paragraph("Datos del Cliente", estilo_subtitulo))
        cliente = compra.cliente
        datos_cliente = [
            ["Nombre:", f"{cliente.first_name} {cliente.last_name}"],
            ["Email:", cliente.email],
            ["Teléfono:", cliente.phone or "—"],
        ]
        tabla_cliente = Table(datos_cliente, colWidths=[5 * cm, 10 * cm])
        tabla_cliente.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    (
                        "ROWBACKGROUNDS",
                        (0, 0),
                        (-1, -1),
                        [colors.white, colors.HexColor("#f5f5f5")],
                    ),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        elementos.append(tabla_cliente)
        elementos.append(Spacer(1, 0.6 * cm))

        elementos.append(Paragraph("Detalle de la Compra", estilo_subtitulo))
        coreografia = compra.coreografia
        profesor_nombre = (
            f"{coreografia.profesor.first_name} {coreografia.profesor.last_name}"
            if coreografia.profesor
            else "—"
        )
        cabecera = [["Descripción", "Género", "Nivel", "Precio"]]
        # Desde SCRUM-30 genero es FK a Genero y puede ser None (SET_NULL)
        genero_nombre = coreografia.genero.nombre if coreografia.genero else "—"
        fila = [
            [
                Paragraph(coreografia.titulo, estilo_normal),
                genero_nombre,
                coreografia.get_nivel_display(),
                f"${compra.precio_pagado:,.2f}",
            ]
        ]

        tabla_detalle = Table(
            cabecera + fila,
            colWidths=[7 * cm, 3 * cm, 3 * cm, 2 * cm],
        )
        tabla_detalle.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor("#f5f5f5")],
                    ),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elementos.append(tabla_detalle)
        elementos.append(Spacer(1, 0.3 * cm))
        elementos.append(Paragraph(f"Profesor: {profesor_nombre}", estilo_normal))
        elementos.append(Spacer(1, 0.8 * cm))

        total_data = [["", "TOTAL PAGADO:", f"${compra.precio_pagado:,.2f}"]]
        tabla_total = Table(total_data, colWidths=[8 * cm, 4 * cm, 3 * cm])
        tabla_total.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 12),
                    ("TEXTCOLOR", (1, 0), (-1, -1), colors.HexColor("#1a1a2e")),
                    ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                    ("LINEABOVE", (1, 0), (-1, 0), 1.5, colors.HexColor("#1a1a2e")),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        elementos.append(tabla_total)
        elementos.append(Spacer(1, 1.5 * cm))

        elementos.append(
            Paragraph(
                "Gracias por tu compra. Para soporte escríbenos a soporte@flowstate.com.",  # noqa: E501
                estilo_normal,
            )
        )

        doc.build(elementos)
        buffer.seek(0)
        return buffer


def _carrito_queryset():
    """
    Queryset base de Carrito con los items y sus coreografías precargados.

    Se usa en todas las vistas de carrito para calcular subtotal/iva/total
    sin disparar una query extra por cada item (N+1).
    """
    return Carrito.objects.prefetch_related(
        Prefetch(
            "items",
            queryset=CarritoItem.objects.select_related(
                "coreografia", "coreografia__genero"
            ),
        )
    )


def _carrito_vacio():
    """
    Estructura de respuesta cuando el cliente/sesión no tiene carrito aún.

    Los totales se envían como string, igual que CarritoSerializer, para
    mantener la precisión monetaria (evita que el renderer JSON los
    convierta a float).
    """
    cero = str(Decimal("0.00"))
    return {"items": [], "subtotal": cero, "iva_monto": cero, "total": cero}


def _identidad_o_error(request):
    """
    Resuelve cómo identificar el carrito del request actual.

    Prioriza el JWT: si `request.user` está autenticado, el carrito se
    identifica por cliente. Si no, busca el header X-Session-ID para
    carritos anónimos.

    Retorna (True, {"cliente": user}) o (True, {"session_id": sid}) si
    pudo resolver una identidad, o (False, Response(400)) si no hay JWT
    ni header — la vista debe retornar esa respuesta tal cual.
    """
    if request.user and request.user.is_authenticated:
        return True, {"cliente": request.user}

    session_id = request.headers.get("X-Session-ID")
    if session_id:
        return True, {"session_id": session_id}

    return False, Response(
        {"error": "Se requiere autenticación o el header X-Session-ID."},
        status=status.HTTP_400_BAD_REQUEST,
    )


def _buscar_carrito(identidad):
    """Busca el carrito de la identidad dada sin crearlo si no existe."""
    if "cliente" in identidad:
        return _carrito_queryset().filter(cliente=identidad["cliente"]).first()
    return (
        _carrito_queryset()
        .filter(session_id=identidad["session_id"], cliente=None)
        .first()
    )


def _obtener_o_crear_carrito(identidad):
    """Obtiene el carrito de la identidad dada, creándolo si no existe."""
    if "cliente" in identidad:
        carrito, _creado = Carrito.objects.get_or_create(cliente=identidad["cliente"])
    else:
        carrito, _creado = Carrito.objects.get_or_create(
            session_id=identidad["session_id"], cliente=None
        )
    return carrito


class CarritoDetailView(APIView):
    """
    GET /api/v1/carrito/

    Retorna el carrito del cliente autenticado (JWT) o del carrito
    anónimo identificado por el header X-Session-ID. No crea un carrito
    nuevo si no existe: en ese caso retorna una estructura vacía con
    los totales en 0, para no ensuciar la base de datos con carritos
    que nunca llegaron a tener un item.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """Retorna el carrito con sus items y totales, o un carrito vacío."""
        ok, identidad = _identidad_o_error(request)
        if not ok:
            return identidad

        carrito = _buscar_carrito(identidad)
        if carrito is None:
            return Response(_carrito_vacio())

        return Response(CarritoSerializer(carrito).data)


class CarritoItemCreateView(APIView):
    """
    POST /api/v1/carrito/items/

    Agrega una coreografía al carrito del cliente autenticado o de la
    sesión anónima (X-Session-ID). Crea el carrito si todavía no existe.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """
        Valida y agrega el ítem, devolviendo el carrito actualizado.

        Retorna 400 si: falta coreografia_id, la coreografía no existe o
        no está publicada, ya está en el carrito, o el cliente ya la compró.
        """
        coreografia_id = request.data.get("coreografia_id")
        if not coreografia_id:
            return Response(
                {"error": "coreografia_id es requerido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            coreografia = Coreografia.objects.get(
                pk=coreografia_id, estado=Coreografia.Estado.PUBLICADO
            )
        except (Coreografia.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "La coreografía no existe o no está disponible."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ok, identidad = _identidad_o_error(request)
        if not ok:
            return identidad

        # Solo un cliente autenticado puede tener historial de compras;
        # una sesión anónima nunca "ya compró" nada.
        if "cliente" in identidad:
            ya_comprada = Compra.objects.filter(
                cliente=identidad["cliente"], coreografia=coreografia
            ).exists()
            if ya_comprada:
                return Response(
                    {"error": "Ya compraste esta coreografía."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        carrito = _obtener_o_crear_carrito(identidad)

        if CarritoItem.objects.filter(
            carrito=carrito, coreografia=coreografia
        ).exists():
            return Response(
                {"error": "Esta coreografía ya está en el carrito."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        CarritoItem.objects.create(carrito=carrito, coreografia=coreografia)

        carrito = _carrito_queryset().get(pk=carrito.pk)
        return Response(CarritoSerializer(carrito).data, status=status.HTTP_201_CREATED)


class CarritoItemDeleteView(APIView):
    """
    DELETE /api/v1/carrito/items/{coreografia_id}/

    Elimina una coreografía del carrito del cliente autenticado o de la
    sesión anónima (X-Session-ID). No crea el carrito si no existe.
    """

    permission_classes = [AllowAny]

    def delete(self, request, coreografia_id):
        """Elimina el item; retorna 404 si el carrito o el item no existen."""
        ok, identidad = _identidad_o_error(request)
        if not ok:
            return identidad

        carrito = _buscar_carrito(identidad)
        if carrito is None:
            return Response(
                {"error": "El carrito no existe."}, status=status.HTTP_404_NOT_FOUND
            )

        item = CarritoItem.objects.filter(
            carrito=carrito, coreografia_id=coreografia_id
        ).first()
        if item is None:
            return Response(
                {"error": "Esa coreografía no está en el carrito."},
                status=status.HTTP_404_NOT_FOUND,
            )

        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CarritoMergeView(APIView):
    """
    POST /api/v1/carrito/merge/

    Se llama justo después de que un usuario anónimo inicia sesión, para
    no perder los items que agregó al carrito antes de loguearse.

    Mueve los items del carrito anónimo (identificado por session_id en
    el body) al carrito del usuario autenticado, evitando duplicados y
    coreografías que el usuario ya compró. Al final elimina el carrito
    anónimo, ya que su contenido ya fue absorbido (o descartado).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Fusiona el carrito anónimo indicado con el del usuario autenticado."""
        session_id = request.data.get("session_id")
        if not session_id:
            return Response(
                {"error": "session_id es requerido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        carrito_anonimo = (
            Carrito.objects.filter(session_id=session_id, cliente=None)
            .prefetch_related("items")
            .first()
        )
        carrito_usuario, _creado = Carrito.objects.get_or_create(cliente=request.user)

        if carrito_anonimo is not None:
            ids_en_carrito_usuario = set(
                CarritoItem.objects.filter(carrito=carrito_usuario).values_list(
                    "coreografia_id", flat=True
                )
            )
            ids_ya_comprados = set(
                Compra.objects.filter(cliente=request.user).values_list(
                    "coreografia_id", flat=True
                )
            )

            for item in carrito_anonimo.items.all():
                if item.coreografia_id in ids_en_carrito_usuario:
                    continue
                if item.coreografia_id in ids_ya_comprados:
                    continue
                CarritoItem.objects.create(
                    carrito=carrito_usuario, coreografia_id=item.coreografia_id
                )
                ids_en_carrito_usuario.add(item.coreografia_id)

            # El carrito anónimo ya cumplió su propósito: sus items válidos
            # se movieron y los inválidos (duplicados/comprados) se descartan.
            carrito_anonimo.delete()

        carrito_usuario = _carrito_queryset().get(pk=carrito_usuario.pk)
        return Response(CarritoSerializer(carrito_usuario).data)


class CheckoutIniciarView(APIView):
    """
    POST /api/v1/checkout/iniciar/

    Valida el carrito del cliente autenticado y retorna un resumen
    del checkout: items, subtotal, IVA y total a pagar.
    No crea ninguna orden aún — es solo una vista previa para que el
    frontend muestre el paso de confirmación antes del pago.

    Requiere JWT. Retorna 400 si el carrito está vacío.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Retorna el resumen del carrito o 400 si el carrito está vacío o no existe.

        Verifica además que todas las coreografías del carrito siguen publicadas,
        por si el catálogo cambió entre que el cliente agregó items y llega al checkout.
        """
        carrito = _carrito_queryset().filter(cliente=request.user).first()

        if carrito is None or not carrito.items.exists():
            return Response(
                {"error": "El carrito está vacío."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar que todos los items del carrito siguen disponibles
        items = list(carrito.items.all())
        ids_no_publicados = [
            item.coreografia_id
            for item in items
            if item.coreografia.estado != Coreografia.Estado.PUBLICADO
        ]
        if ids_no_publicados:
            return Response(
                {
                    "error": (
                        "Algunas coreografías del carrito ya no están disponibles. "
                        "Por favor revisa tu carrito."
                    ),
                    "coreografias_no_disponibles": ids_no_publicados,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        subtotal = sum((item.coreografia.precio for item in items), Decimal("0.00"))
        iva_monto = (subtotal * IVA_PORCENTAJE).quantize(Decimal("0.01"))
        total = subtotal + iva_monto

        data = {
            # Se pasan los CarritoItem "crudos" (no ya serializados): el campo
            # `items = CarritoItemSerializer(many=True)` de CheckoutResumenSerializer
            # necesita instancias reales para resolver sus fuentes "coreografia.*".
            # Pasar aquí `.data` (ya serializado) haría que esas fuentes no
            # resuelvan sobre un dict plano y DRF las omitiría en silencio.
            "items": items,
            "subtotal": str(subtotal),
            "iva_monto": str(iva_monto),
            "total": str(total),
            "metodos_disponibles": [
                Orden.MetodoPago.PSE,
                Orden.MetodoPago.TARJETA,
            ],
        }
        serializer = CheckoutResumenSerializer(data)
        return Response(serializer.data)


TASA_EXITO_PAGO = Decimal("0.90")  # 90% de probabilidad de éxito en la simulación


class CheckoutProcesarView(APIView):
    """
    POST /api/v1/checkout/procesar/

    Procesa el pago simulado del carrito del cliente autenticado.
    Si el pago simulado es exitoso (90% de probabilidad):
      - Crea una Orden con sus OrdenItems en una transacción atómica
      - Crea una Compra por cada coreografía (para mantener el historial)
      - Elimina el carrito
      - Dispara la señal checkout_exitoso (email simulado)
      - Retorna 201 con los datos de la orden

    Si el pago es rechazado (10% de probabilidad):
      - Retorna 402 con mensaje de error
      - El carrito permanece intacto para permitir reintento

    Idempotencia: si se envía la misma idempotency_key de una orden ya
    completada, retorna 200 con la orden existente sin reprocesar.

    Body requerido:
      - metodo_pago: "pse" | "tarjeta"
      - idempotency_key: string único (UUID recomendado, generado por el frontend)
      - datos_facturacion: objeto opcional con datos del pagador

    Requiere JWT.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Valida el request, simula el pago y crea la orden si es exitoso.

        Retorna 400 si faltan campos, 402 si el pago es rechazado,
        200 si la idempotency_key ya fue procesada, o 201 en éxito nuevo.
        """
        metodo_pago = request.data.get("metodo_pago")
        idempotency_key = request.data.get("idempotency_key")
        datos_facturacion = request.data.get("datos_facturacion")

        # Validar campos requeridos
        if not metodo_pago:
            return Response(
                {"error": "metodo_pago es requerido (pse o tarjeta)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if metodo_pago not in [Orden.MetodoPago.PSE, Orden.MetodoPago.TARJETA]:
            return Response(
                {"error": "metodo_pago debe ser 'pse' o 'tarjeta'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not idempotency_key:
            return Response(
                {"error": "idempotency_key es requerida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Idempotencia: retornar la orden existente si ya fue procesada
        orden_existente = (
            Orden.objects.filter(
                idempotency_key=idempotency_key,
                cliente=request.user,
                estado=Orden.Estado.COMPLETADA,
            )
            .prefetch_related("items__coreografia")
            .first()
        )
        if orden_existente:
            return Response(
                OrdenSerializer(orden_existente).data,
                status=status.HTTP_200_OK,
            )

        # Verificar que el carrito existe y tiene items
        carrito = _carrito_queryset().filter(cliente=request.user).first()
        if carrito is None or not carrito.items.exists():
            return Response(
                {"error": "El carrito está vacío."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items = list(carrito.items.all())

        # Calcular totales
        subtotal = sum((item.coreografia.precio for item in items), Decimal("0.00"))
        iva_monto = (subtotal * IVA_PORCENTAJE).quantize(Decimal("0.01"))
        total = subtotal + iva_monto

        # Simulación aleatoria: 90% éxito, 10% rechazo
        pago_exitoso = random.random() < float(TASA_EXITO_PAGO)

        if not pago_exitoso:
            return Response(
                {
                    "error": (
                        "El pago fue rechazado por el banco. "
                        "Por favor intenta de nuevo o usa otro método de pago."
                    ),
                    "codigo": "PAGO_RECHAZADO",
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # Pago exitoso: crear orden, items y compras en una sola transacción atómica
        # Si algo falla en mitad del proceso, todo el bloque se revierte
        # (ni la orden, ni los items, ni las compras quedarán a medias)
        with transaction.atomic():
            orden = Orden.objects.create(
                cliente=request.user,
                total=total,
                estado=Orden.Estado.COMPLETADA,
                metodo_pago=metodo_pago,
                idempotency_key=idempotency_key,
                datos_facturacion=datos_facturacion,
            )

            # Determinar el método equivalente en Compra (PSE → transferencia)
            metodo_compra = (
                Compra.MetodoPago.TARJETA
                if metodo_pago == Orden.MetodoPago.TARJETA
                else Compra.MetodoPago.TRANSFERENCIA
            )

            for item in items:
                OrdenItem.objects.create(
                    orden=orden,
                    coreografia=item.coreografia,
                    precio_pagado=item.coreografia.precio,
                )
                # Se crea una Compra por cada coreografía para que
                # el historial de compras existente siga funcionando
                # sin cambios (GET /api/v1/clientes/me/compras/)
                Compra.objects.create(
                    cliente=request.user,
                    coreografia=item.coreografia,
                    precio_pagado=item.coreografia.precio,
                    estado=Compra.Estado.ACTIVA,
                    metodo_pago=metodo_compra,
                )

            # Eliminar el carrito una vez procesado el pago
            carrito.delete()

        # Disparar señal post-checkout fuera de la transacción
        # para no bloquear el commit si el handler falla
        checkout_exitoso.send(
            sender=Orden,
            orden=orden,
            request=request,
        )

        orden = Orden.objects.prefetch_related("items__coreografia").get(pk=orden.pk)
        return Response(
            OrdenSerializer(orden).data,
            status=status.HTTP_201_CREATED,
        )
