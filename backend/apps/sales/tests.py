"""
Tests de SCRUM-105 — Historial de compras y validación de acceso.

Cubre:
- GET /api/v1/clientes/me/compras/ retorna solo las compras del usuario autenticado
- Filtros por fecha_inicio, fecha_fin y genero
- Paginación (page_size=10)
- 403 si un cliente intenta ver las compras de otro cliente
- 403 si un cliente intenta descargar la factura de otro cliente
- Generación de factura PDF (Content-Type: application/pdf)
"""

from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.catalog.models import Coreografia, Video
from apps.sales.models import Compra
from apps.users.models import User


def get_tokens_for_user(user):
    """Genera un par de tokens JWT para el usuario dado."""
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


def crear_coreografia(titulo="Salsa Básica", genero="salsa", precio="50.00"):
    return Coreografia.objects.create(
        titulo=titulo,
        genero=genero,
        nivel=Coreografia.Nivel.PRINCIPIANTE,
        precio=Decimal(precio),
        estado=Coreografia.Estado.PUBLICADO,
    )


def crear_compra(cliente, coreografia, estado=Compra.Estado.ACTIVA):
    return Compra.objects.create(
        cliente=cliente,
        coreografia=coreografia,
        precio_pagado=coreografia.precio,
        estado=estado,
    )


class PurchaseHistoryViewTest(APITestCase):
    """Tests para GET /api/v1/clientes/me/compras/"""

    def setUp(self):
        self.url = reverse("sales:purchase-history")
        self.cliente = User.objects.create_user(
            email="cliente@test.com",
            password="Pass1234!",
            first_name="Ana",
            last_name="López",
            role=User.Role.CLIENTE,
        )
        self.otro_cliente = User.objects.create_user(
            email="otro@test.com",
            password="Pass1234!",
            first_name="Pedro",
            last_name="Ríos",
            role=User.Role.CLIENTE,
        )
        self.token = get_tokens_for_user(self.cliente)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.coreografia = crear_coreografia()
        self.compra = crear_compra(self.cliente, self.coreografia)
        self.compra_ajena = crear_compra(self.otro_cliente, self.coreografia)

    def test_retorna_solo_compras_propias(self):
        """El historial solo contiene las compras del usuario autenticado."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [c["id"] for c in response.data["results"]]
        self.assertIn(self.compra.pk, ids)
        self.assertNotIn(self.compra_ajena.pk, ids)

    def test_requiere_autenticacion(self):
        """Sin token JWT el endpoint retorna 401."""
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_respuesta_incluye_coreografia_anidada(self):
        """La respuesta incluye los datos de la coreografía anidada."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        compra_data = response.data["results"][0]
        self.assertIn("coreografia", compra_data)
        self.assertEqual(compra_data["coreografia"]["titulo"], self.coreografia.titulo)

    def test_respuesta_incluye_videos_anidados(self):
        """La coreografía en la respuesta incluye sus videos."""
        Video.objects.create(
            coreografia=self.coreografia,
            url="https://storage.supabase.co/video1.mp4",
            duracion_segundos=120,
            orden=1,
        )
        response = self.client.get(self.url)
        compra_data = response.data["results"][0]
        self.assertIn("videos", compra_data["coreografia"])
        self.assertEqual(len(compra_data["coreografia"]["videos"]), 1)

    def test_filtro_por_genero(self):
        """El filtro ?genero= retorna solo compras de ese género de baile."""
        coreografia_merengue = crear_coreografia(
            titulo="Merengue Intro", genero="merengue"
        )
        crear_compra(self.cliente, coreografia_merengue)

        response = self.client.get(self.url, {"genero": "salsa"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for compra in response.data["results"]:
            self.assertEqual(compra["coreografia"]["genero"], "salsa")

    def test_filtro_por_genero_case_insensitive(self):
        """El filtro ?genero= es insensible a mayúsculas."""
        response = self.client.get(self.url, {"genero": "SALSA"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_filtro_por_fecha_inicio(self):
        """El filtro ?fecha_inicio= excluye compras anteriores a esa fecha."""
        manana = (timezone.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        response = self.client.get(self.url, {"fecha_inicio": manana})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_filtro_por_fecha_fin(self):
        """El filtro ?fecha_fin= excluye compras posteriores a esa fecha.

        Se usan 2 días atrás (no 1) para absorber el offset UTC-5 de Bogotá:
        'ayer 23:59:59 Bogotá' equivale a 'hoy 04:59:59 UTC', lo que
        podría incluir compras creadas hoy dependiendo de la hora de ejecución.
        """
        dos_dias_atras = (timezone.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        response = self.client.get(self.url, {"fecha_fin": dos_dias_atras})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_fecha_invalida_retorna_400(self):
        """Un formato de fecha incorrecto retorna 400 con mensaje de error."""
        response = self.client.get(self.url, {"fecha_inicio": "2024/01/01"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_paginacion_page_size_10(self):
        """La respuesta viene paginada y contiene las claves de paginación."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
        self.assertIn("results", response.data)

    def test_paginacion_respeta_page_size_maximo(self):
        """Con 11 compras la segunda página existe."""
        coreografias_extra = [
            crear_coreografia(titulo=f"Coreografía {i}", genero="salsa")
            for i in range(10)
        ]
        for c in coreografias_extra:
            crear_compra(self.cliente, c)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 10)
        self.assertIsNotNone(response.data["next"])


class CompraDetailViewTest(APITestCase):
    """Tests para GET /api/v1/clientes/me/compras/{id}/"""

    def setUp(self):
        self.cliente = User.objects.create_user(
            email="cliente2@test.com",
            password="Pass1234!",
            first_name="Luisa",
            last_name="Mora",
            role=User.Role.CLIENTE,
        )
        self.otro_cliente = User.objects.create_user(
            email="otro2@test.com",
            password="Pass1234!",
            first_name="Carlos",
            last_name="Gil",
            role=User.Role.CLIENTE,
        )
        self.token = get_tokens_for_user(self.cliente)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.coreografia = crear_coreografia()
        self.compra = crear_compra(self.cliente, self.coreografia)
        self.compra_ajena = crear_compra(self.otro_cliente, self.coreografia)

    def test_cliente_ve_su_propia_compra(self):
        """Un cliente puede acceder al detalle de su propia compra."""
        url = reverse("sales:purchase-detail", kwargs={"pk": self.compra.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.compra.pk)

    def test_cliente_no_puede_ver_compra_ajena(self):
        """Intentar acceder a la compra de otro cliente retorna 403."""
        url = reverse("sales:purchase-detail", kwargs={"pk": self.compra_ajena.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_compra_inexistente_retorna_404(self):
        """Un ID que no existe retorna 404."""
        url = reverse("sales:purchase-detail", kwargs={"pk": 99999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class FacturaPDFViewTest(APITestCase):
    """Tests para GET /api/v1/clientes/me/compras/{id}/factura/"""

    def setUp(self):
        self.cliente = User.objects.create_user(
            email="factura@test.com",
            password="Pass1234!",
            first_name="Marta",
            last_name="Vega",
            role=User.Role.CLIENTE,
        )
        self.otro_cliente = User.objects.create_user(
            email="otro3@test.com",
            password="Pass1234!",
            first_name="Jorge",
            last_name="Ruiz",
            role=User.Role.CLIENTE,
        )
        self.token = get_tokens_for_user(self.cliente)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.coreografia = crear_coreografia()
        self.compra = crear_compra(self.cliente, self.coreografia)
        self.compra_ajena = crear_compra(self.otro_cliente, self.coreografia)

    def test_genera_pdf_exitosamente(self):
        """La factura de una compra propia retorna 200 con Content-Type PDF."""
        url = reverse("sales:purchase-invoice", kwargs={"pk": self.compra.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_factura_tiene_content_disposition(self):
        """La respuesta incluye Content-Disposition para descarga."""
        url = reverse("sales:purchase-invoice", kwargs={"pk": self.compra.pk})
        response = self.client.get(url)
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertIn(".pdf", response["Content-Disposition"])

    def test_factura_de_compra_ajena_retorna_403(self):
        """Intentar descargar la factura de otro cliente retorna 403."""
        url = reverse("sales:purchase-invoice", kwargs={"pk": self.compra_ajena.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_factura_compra_inexistente_retorna_404(self):
        """Un ID de compra inexistente retorna 404."""
        url = reverse("sales:purchase-invoice", kwargs={"pk": 99999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
