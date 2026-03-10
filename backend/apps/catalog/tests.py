from django.test import TestCase


class CatalogTests(TestCase):
    def test_ping(self):
        resp = self.client.get('/api/v1/catalog/ping/')
        self.assertIn(resp.status_code, (200, 302))
