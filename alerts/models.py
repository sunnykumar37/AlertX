from django.db import models
from django.contrib.auth.models import User


class EmergencyContact(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="emergency_contacts")
	email = models.EmailField()
	is_primary = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-is_primary", "email"]
		unique_together = ("user", "email")

	def __str__(self):
		return f"{self.user.username} -> {self.email}"


class SOSAlert(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sos_alerts")
	timestamp = models.DateTimeField(auto_now_add=True)
	latitude = models.DecimalField(max_digits=9, decimal_places=6)
	longitude = models.DecimalField(max_digits=9, decimal_places=6)
	image = models.ImageField(upload_to="sos_images/", blank=True, null=True)

	class Meta:
		ordering = ["-timestamp"]

	@property
	def maps_link(self):
		return f"https://maps.google.com/?q={self.latitude},{self.longitude}"

	def __str__(self):
		return f"SOS by {self.user.username} at {self.timestamp:%Y-%m-%d %H:%M:%S}"
