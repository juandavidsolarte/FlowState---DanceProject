import json
from datetime import timedelta
from unittest.mock import patch
from uuid import uuid4

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import User


class RegistrationFlowTests(TestCase):
    def setUp(self):
        self.payload = {
            "first_name": "Ana",
            "last_name": "García",
            "email": "ana@example.com",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
            "date_of_birth": "1995-05-10",
            "country": "Colombia",
            "age_confirmation": True,
            "terms_accepted": True,
            "recaptcha_token": "test-token",
        }

    @patch("apps.users.views.send_verification_email")
    def test_successful_registration_creates_unverified_user(self, mock_send):
        response = self.client.post(
            reverse("users:register"),
            data=json.dumps(self.payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email="ana@example.com")
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_verified)
        self.assertIsNotNone(user.verification_token)
        mock_send.assert_called_once()

    @patch("apps.users.views.send_verification_email")
    def test_duplicate_email_registration_fails(self, mock_send):
        User.objects.create_user(
            email="ana@example.com",
            password="StrongPass123",
            first_name="Ana",
            last_name="García",
        )
        response = self.client.post(
            reverse("users:register"),
            data=json.dumps(self.payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())
        mock_send.assert_not_called()

    @patch("apps.users.views.send_verification_email")
    def test_underage_registration_fails(self, mock_send):
        payload = {
            **self.payload,
            "email": "minor@example.com",
            "date_of_birth": "2010-01-01",
        }
        response = self.client.post(
            reverse("users:register"),
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("date_of_birth", response.json())
        mock_send.assert_not_called()

    @patch("apps.users.views.send_verification_email")
    def test_missing_date_of_birth_fails(self, mock_send):
        payload = {**self.payload}
        del payload["date_of_birth"]
        response = self.client.post(
            reverse("users:register"),
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("date_of_birth", response.json())
        mock_send.assert_not_called()

    @patch("apps.users.views.send_verification_email")
    def test_missing_captcha_fails(self, mock_send):
        payload = {**self.payload, "recaptcha_token": ""}
        response = self.client.post(
            reverse("users:register"),
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("recaptcha_token", response.json())
        mock_send.assert_not_called()


class VerificationFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="verify@example.com",
            password="StrongPass123",
            first_name="Veri",
            last_name="Fy",
            is_active=False,
            is_verified=False,
            verification_token=uuid4(),
            verification_token_created_at=timezone.now(),
        )

    def test_email_verification_success(self):
        response = self.client.get(
            reverse(
                "users:verify-email", kwargs={"token": self.user.verification_token}
            )
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified)
        self.assertTrue(self.user.is_active)
        self.assertIsNotNone(self.user.email_verified_at)
        self.assertIsNone(self.user.verification_token)

    def test_invalid_token_fails(self):
        response = self.client.get(
            reverse("users:verify-email", kwargs={"token": uuid4()})
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())

    def test_expired_token_fails(self):
        self.user.verification_token_created_at = timezone.now() - timedelta(hours=25)
        self.user.save(update_fields=["verification_token_created_at"])
        response = self.client.get(
            reverse(
                "users:verify-email", kwargs={"token": self.user.verification_token}
            )
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Verification link has expired.")
