from django.test import TestCase


class CustomersTests(TestCase):
    def test_ping(self):
        resp = self.client.get('/api/v1/customers/ping/')
        self.assertIn(resp.status_code, (200, 302))
