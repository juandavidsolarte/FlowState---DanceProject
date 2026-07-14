"""
Tests de SCRUM-29 — Dashboard Administrativo.

Cubre:
- Los 4 endpoints retornan 200 con datos correctos para Director/Admin.
- Un Cliente o Profesor recibe 403 (permiso IsDirectorOrAdmin).
- Un usuario no autenticado recibe 401.
- Validación de fechas: fecha_desde > fecha_hasta retorna 400.
- Validación de fechas: rango mayor a 1 año retorna 400.
- KPIs con cero compras retorna 0, no error.
- El caché evita recalcular en la segunda petición con los mismos filtros.
"""

from decimal import Decimal

from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.catalog.models import Coreografia, Genero
from apps.sales.models import Compra
from apps.users.models import User


def get_token_for_user(user):
    """Genera un access token JWT para el usuario dado."""
    return str(RefreshToken.for_user(user).access_token)


def crear_usuario(email, role, first_name="Nombre", last_name="Apellido"):
    return User.objects.create_user(
        email=email,
        password="Pass1234!",
        first_name=first_name,
        last_name=last_name,
        role=role,
    )


def crear_coreografia(titulo, precio, genero=None):
    genero_obj = None
    if genero is not None:
        genero_obj, _ = Genero.objects.get_or_create(nombre=genero)
    return Coreografia.objects.create(
        titulo=titulo,
        genero=genero_obj,
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


class DashboardTestsBase(APITestCase):
    """
    Setup común para los 4 endpoints del dashboard.

    Crea un director, un cliente y un profesor (para probar permisos), y
    un conjunto de compras con totales conocidos para poder verificar las
    agregaciones exactas que deben retornar las vistas.
    """

    def setUp(self):
        # LocMemCache persiste entre tests del mismo proceso; sin este
        # clear() un test podría leer datos cacheados por otro test que
        # usó la misma combinación de filtros de fecha (None, None).
        cache.clear()

        self.director = crear_usuario("director@test.com", User.Role.DIRECTOR)
        self.cliente = crear_usuario(
            "cliente@test.com", User.Role.CLIENTE, "Ana", "Lopez"
        )  # noqa: E501
        self.otro_cliente = crear_usuario(
            "otro_cliente@test.com", User.Role.CLIENTE, "Luis", "Perez"
        )
        self.profesor = crear_usuario("profesor@test.com", User.Role.PROFESOR)

        self.coreo_salsa = crear_coreografia("Salsa 1", "100.00", genero="Salsa")
        self.coreo_bachata = crear_coreografia("Bachata 1", "50.00", genero="Bachata")
        self.coreo_sin_genero = crear_coreografia("Sin Genero 1", "25.00", genero=None)

        # Total ACTIVA esperado: 100 + 50 + 100 + 25 = 275.00 en 4 transacciones
        crear_compra(self.cliente, self.coreo_salsa)  # cliente: 100
        crear_compra(self.cliente, self.coreo_bachata)  # cliente: 50 (total 150)
        crear_compra(self.otro_cliente, self.coreo_salsa)  # otro_cliente: 100
        crear_compra(
            self.otro_cliente, self.coreo_sin_genero
        )  # otro_cliente: 25 (125)  # noqa: E501

        # Compra pendiente: no debe contarse en ningún agregado
        crear_compra(self.cliente, self.coreo_bachata, estado=Compra.Estado.PENDIENTE)

        self.kpis_url = reverse("dashboard:dashboard-kpis")
        self.mensuales_url = reverse("dashboard:dashboard-ventas-mensuales")
        self.por_genero_url = reverse("dashboard:dashboard-ventas-por-genero")
        self.top_clientes_url = reverse("dashboard:dashboard-top-clientes")

    def autenticar(self, user):
        token = get_token_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")


class KpisGeneralesViewTest(DashboardTestsBase):
    """Tests para GET /api/v1/dashboard/kpis/"""

    def test_director_obtiene_kpis_correctos(self):
        self.autenticar(self.director)
        response = self.client.get(self.kpis_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_ventas"], "275.00")
        self.assertEqual(response.data["total_transacciones"], 4)
        self.assertEqual(response.data["ticket_promedio"], "68.75")
        self.assertEqual(response.data["total_clientes_unicos"], 2)

    def test_admin_tambien_tiene_acceso(self):
        admin = crear_usuario("admin@test.com", User.Role.ADMIN)
        self.autenticar(admin)
        response = self.client.get(self.kpis_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cliente_recibe_403(self):
        self.autenticar(self.cliente)
        response = self.client.get(self.kpis_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_profesor_recibe_403(self):
        self.autenticar(self.profesor)
        response = self.client.get(self.kpis_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_autenticacion_recibe_401(self):
        response = self.client.get(self.kpis_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sin_compras_retorna_ceros_no_error(self):
        Compra.objects.all().delete()
        self.autenticar(self.director)
        response = self.client.get(self.kpis_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_ventas"], "0.00")
        self.assertEqual(response.data["total_transacciones"], 0)
        self.assertEqual(response.data["ticket_promedio"], "0.00")
        self.assertEqual(response.data["total_clientes_unicos"], 0)

    def test_fecha_desde_mayor_a_fecha_hasta_retorna_400(self):
        self.autenticar(self.director)
        response = self.client.get(
            self.kpis_url,
            {"fecha_desde": "2026-06-01", "fecha_hasta": "2026-01-01"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rango_mayor_a_un_anio_retorna_400(self):
        self.autenticar(self.director)
        response = self.client.get(
            self.kpis_url,
            {"fecha_desde": "2020-01-01", "fecha_hasta": "2026-01-01"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_formato_de_fecha_invalido_retorna_400(self):
        self.autenticar(self.director)
        response = self.client.get(self.kpis_url, {"fecha_desde": "01/01/2026"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cache_evita_recalculo(self):
        """
        Una segunda petición con los mismos filtros no debe reflejar una
        compra nueva creada después de la primera: la respuesta cacheada
        (5 minutos) se sirve tal cual, sin volver a agregar sobre la BD.
        """
        self.autenticar(self.director)
        primera = self.client.get(self.kpis_url)
        self.assertEqual(primera.data["total_transacciones"], 4)

        crear_compra(self.otro_cliente, self.coreo_salsa)

        segunda = self.client.get(self.kpis_url)
        self.assertEqual(segunda.data["total_transacciones"], 4)

        # Sin caché, esta tercera consulta (con un filtro distinto, que no
        # comparte cache_key) sí debe reflejar la compra nueva.
        cache.clear()
        tercera = self.client.get(self.kpis_url)
        self.assertEqual(tercera.data["total_transacciones"], 5)


class VentasMensualesViewTest(DashboardTestsBase):
    """Tests para GET /api/v1/dashboard/ventas-mensuales/"""

    def test_director_obtiene_serie_mensual(self):
        self.autenticar(self.director)
        response = self.client.get(self.mensuales_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        # Todas las compras del setUp se crearon "hoy": un solo punto
        mes_actual = timezone.now().strftime("%Y-%m")
        meses = [punto["mes"] for punto in response.data]
        self.assertIn(mes_actual, meses)
        punto_actual = next(p for p in response.data if p["mes"] == mes_actual)
        self.assertEqual(punto_actual["total_ventas"], "275.00")
        self.assertEqual(punto_actual["cantidad_ventas"], 4)

    def test_permisos_no_director_403(self):
        self.autenticar(self.cliente)
        response = self.client.get(self.mensuales_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_autenticacion_401(self):
        response = self.client.get(self.mensuales_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rango_mayor_a_un_anio_retorna_400(self):
        self.autenticar(self.director)
        response = self.client.get(
            self.mensuales_url,
            {"fecha_desde": "2020-01-01", "fecha_hasta": "2026-06-01"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class VentasPorGeneroViewTest(DashboardTestsBase):
    """Tests para GET /api/v1/dashboard/ventas-por-genero/"""

    def test_director_obtiene_distribucion_correcta(self):
        self.autenticar(self.director)
        response = self.client.get(self.por_genero_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        por_nombre = {punto["genero"]: punto for punto in response.data}
        self.assertEqual(por_nombre["Salsa"]["total_ventas"], "200.00")
        self.assertEqual(por_nombre["Salsa"]["cantidad_ventas"], 2)
        self.assertEqual(por_nombre["Bachata"]["total_ventas"], "50.00")
        self.assertEqual(por_nombre["Sin género"]["total_ventas"], "25.00")

        # Los porcentajes de todos los géneros deben sumar 100%
        suma_porcentajes = sum(Decimal(p["porcentaje"]) for p in response.data)
        self.assertEqual(suma_porcentajes, Decimal("100.00"))

    def test_permisos_no_director_403(self):
        self.autenticar(self.profesor)
        response = self.client.get(self.por_genero_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_autenticacion_401(self):
        response = self.client.get(self.por_genero_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sin_compras_retorna_lista_vacia(self):
        Compra.objects.all().delete()
        self.autenticar(self.director)
        response = self.client.get(self.por_genero_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class TopClientesViewTest(DashboardTestsBase):
    """Tests para GET /api/v1/dashboard/top-clientes/"""

    def test_director_obtiene_ranking_correcto(self):
        self.autenticar(self.director)
        response = self.client.get(self.top_clientes_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        primero = response.data[0]
        self.assertEqual(primero["cliente_id"], self.cliente.pk)
        self.assertEqual(primero["total_gastado"], "150.00")
        self.assertEqual(primero["cantidad_compras"], 2)
        self.assertEqual(primero["nombre"], "Ana Lopez")
        self.assertEqual(primero["email"], "cliente@test.com")

        segundo = response.data[1]
        self.assertEqual(segundo["cliente_id"], self.otro_cliente.pk)
        self.assertEqual(segundo["total_gastado"], "125.00")

    def test_limita_a_5_resultados(self):
        for i in range(6):
            cliente_extra = crear_usuario(f"extra{i}@test.com", User.Role.CLIENTE)
            crear_compra(cliente_extra, self.coreo_salsa)

        self.autenticar(self.director)
        response = self.client.get(self.top_clientes_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data), 5)

    def test_permisos_no_director_403(self):
        self.autenticar(self.cliente)
        response = self.client.get(self.top_clientes_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_sin_autenticacion_401(self):
        response = self.client.get(self.top_clientes_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
