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
