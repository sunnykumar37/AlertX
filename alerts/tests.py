from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import EmergencyContact, SOSAlert


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AlertsTests(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(username="alice", password="StrongPass123")

	def test_dashboard_requires_login(self):
		response = self.client.get(reverse("dashboard"))
		self.assertEqual(response.status_code, 302)
		self.assertIn(reverse("login"), response.url)

	def test_send_sos_creates_alert(self):
		self.client.login(username="alice", password="StrongPass123")
		EmergencyContact.objects.create(user=self.user, email="contact@example.com", is_primary=True)
		image = SimpleUploadedFile("capture.jpg", b"fake-image-bytes", content_type="image/jpeg")

		response = self.client.post(
			reverse("send_sos"),
			{
				"latitude": "12.971599",
				"longitude": "77.594566",
				"image": image,
			},
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json().get("message"), "Alert sent successfully")
		self.assertEqual(SOSAlert.objects.filter(user=self.user).count(), 1)

	def test_dashboard_auto_creates_contact_from_registered_email(self):
		self.user.email = "alice@example.com"
		self.user.save(update_fields=["email"])

		self.client.login(username="alice", password="StrongPass123")
		response = self.client.get(reverse("dashboard"))

		self.assertEqual(response.status_code, 200)
		self.assertTrue(
			EmergencyContact.objects.filter(user=self.user, email="alice@example.com").exists()
		)

	def test_register_creates_primary_contact_with_account_email(self):
		response = self.client.post(
			reverse("register"),
			{
				"username": "bob",
				"email": "bob@example.com",
				"password1": "VeryStrongPass123!",
				"password2": "VeryStrongPass123!",
			},
		)

		self.assertEqual(response.status_code, 302)
		user = User.objects.get(username="bob")
		contact = EmergencyContact.objects.get(user=user, email="bob@example.com")
		self.assertTrue(contact.is_primary)

	def test_dashboard_normalizes_to_single_primary_contact(self):
		self.client.login(username="alice", password="StrongPass123")
		first = EmergencyContact.objects.create(user=self.user, email="first@example.com", is_primary=True)
		second = EmergencyContact.objects.create(user=self.user, email="second@example.com", is_primary=True)

		response = self.client.get(reverse("dashboard"))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(
			EmergencyContact.objects.filter(user=self.user, is_primary=True).count(),
			1,
		)
		first.refresh_from_db()
		second.refresh_from_db()
		self.assertTrue(first.is_primary)
		self.assertFalse(second.is_primary)
