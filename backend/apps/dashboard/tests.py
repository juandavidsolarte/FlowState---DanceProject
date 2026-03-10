from django.test import TestCase


class DashboardTests(TestCase):
    def test_ping(self):
        resp = self.client.get('/api/v1/dashboard/ping/')
        self.assertIn(resp.status_code, (200, 302))
