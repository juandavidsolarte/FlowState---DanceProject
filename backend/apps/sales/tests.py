from django.test import TestCase


class SalesTests(TestCase):
    def test_ping(self):
        resp = self.client.get('/api/v1/sales/ping/')
        self.assertIn(resp.status_code, (200, 302))
