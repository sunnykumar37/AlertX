import base64
import binascii
import uuid
import smtplib
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.mail import EmailMessage
from django.core.validators import validate_email
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from decimal import Decimal, InvalidOperation

from .forms import EmailOrUsernameAuthenticationForm, RegisterForm
from .models import EmergencyContact, SOSAlert


def login_view(request):
	if request.user.is_authenticated:
		return redirect("dashboard")

	if request.method == "POST":
		form = EmailOrUsernameAuthenticationForm(request, data=request.POST)
		if form.is_valid():
			login(request, form.get_user())
			return redirect(request.GET.get("next") or "dashboard")
	else:
		form = EmailOrUsernameAuthenticationForm(request)

	return render(request, "registration/login.html", {"form": form})


def logout_view(request):
	if request.method == "POST":
		logout(request)
		messages.success(request, "You have been logged out.")
	return redirect("login")


def register_view(request):
	if request.user.is_authenticated:
		return redirect("dashboard")

	if request.method == "POST":
		form = RegisterForm(request.POST)
		if form.is_valid():
			user = form.save()
			login(request, user)
			messages.success(request, "Welcome. Your account has been created.")
			return redirect("dashboard")
	else:
		form = RegisterForm()

	return render(request, "registration/register.html", {"form": form})


@login_required
def dashboard_view(request):
	if request.method == "POST":
		action = request.POST.get("action")

		if action == "add_contact":
			email = request.POST.get("email", "").strip().lower()
			is_primary = request.POST.get("is_primary") == "on"
			if email:
				contact, created = EmergencyContact.objects.get_or_create(
					user=request.user,
					email=email,
					defaults={"is_primary": is_primary},
				)
				if not created:
					contact.is_primary = is_primary
					contact.save(update_fields=["is_primary"])

				if is_primary:
					EmergencyContact.objects.filter(user=request.user).exclude(pk=contact.pk).update(is_primary=False)
				messages.success(request, "Emergency contact saved.")
			else:
				messages.error(request, "Please provide a valid email.")

		if action == "delete_contact":
			contact_id = request.POST.get("contact_id")
			EmergencyContact.objects.filter(user=request.user, id=contact_id).delete()
			messages.success(request, "Emergency contact removed.")

		if action == "delete_alert":
			alert_id = request.POST.get("alert_id")
			SOSAlert.objects.filter(user=request.user, id=alert_id).delete()
			messages.success(request, "SOS history entry removed.")

		return redirect("dashboard")

	contacts = EmergencyContact.objects.filter(user=request.user)
	alerts = SOSAlert.objects.filter(user=request.user)[:10]
	return render(request, "alerts/dashboard.html", {"contacts": contacts, "alerts": alerts})


@login_required
def send_sos_view(request):
	if request.method != "POST":
		return JsonResponse({"error": "Method not allowed."}, status=405)

	latitude_raw = request.POST.get("latitude", "").strip()
	longitude_raw = request.POST.get("longitude", "").strip()
	if not latitude_raw or not longitude_raw:
		return JsonResponse({"error": "Latitude and longitude are required."}, status=400)

	try:
		latitude = Decimal(latitude_raw)
		longitude = Decimal(longitude_raw)
	except (InvalidOperation, TypeError):
		return JsonResponse({"error": "Invalid coordinates."}, status=400)

	image = request.FILES.get("image")
	image_base64 = request.POST.get("image_base64", "").strip()

	if image is None and image_base64:
		try:
			data_part = image_base64
			extension = "jpg"
			if ";base64," in image_base64:
				header, data_part = image_base64.split(";base64,", 1)
				if "/" in header:
					extension = header.split("/")[-1].lower() or "jpg"

			decoded = base64.b64decode(data_part)
			filename = f"sos_{uuid.uuid4().hex}.{extension}"
			image = ContentFile(decoded, name=filename)
		except (ValueError, binascii.Error):
			return JsonResponse({"error": "Invalid base64 image payload."}, status=400)

	if image is None:
		return JsonResponse({"error": "Image is required for SOS alerts."}, status=400)

	maps_link = f"https://maps.google.com/?q={latitude},{longitude}"

	alert = SOSAlert.objects.create(
		user=request.user,
		latitude=latitude,
		longitude=longitude,
		image=image,
	)

	recipients = list(EmergencyContact.objects.filter(user=request.user).values_list("email", flat=True))
	if request.user.email and request.user.email not in recipients:
		recipients.append(request.user.email)

	# Remove empty and invalid recipient addresses to prevent SMTP failures.
	clean_recipients = []
	for address in recipients:
		candidate = (address or "").strip()
		if not candidate:
			continue
		try:
			validate_email(candidate)
			clean_recipients.append(candidate)
		except ValidationError:
			continue

	recipients = list(dict.fromkeys(clean_recipients))

	if not recipients:
		return JsonResponse({"error": "No valid emergency contact emails configured for this account."}, status=400)

	timestamp = timezone.localtime(alert.timestamp).strftime("%Y-%m-%d %H:%M:%S %Z")
	body = (
		"SOS emergency alert has been triggered.\n\n"
		f"User: {request.user.username}\n"
		f"Timestamp: {timestamp}\n"
		f"Location: {maps_link}\n\n"
		"Warning: This is an emergency signal. Please contact the user and local emergency services immediately."
	)

	email = EmailMessage(
		subject="🚨 Emergency SOS Alert",
		body=body,
		to=recipients,
		from_email=settings.DEFAULT_FROM_EMAIL,
	)

	if not email.from_email:
		return JsonResponse({"error": "Email sender is not configured. Set EMAIL_HOST_USER and DEFAULT_FROM_EMAIL."}, status=500)

	if alert.image:
		alert.image.open("rb")
		image_bytes = alert.image.read()
		alert.image.close()
		content_type = getattr(image, "content_type", None) or "image/jpeg"
		email.attach(alert.image.name.split("/")[-1], image_bytes, content_type)

	try:
		email.send(fail_silently=False)
	except smtplib.SMTPAuthenticationError:
		return JsonResponse(
			{
				"error": (
					"Email authentication failed. Set EMAIL_HOST_USER to your Gmail address "
					"and EMAIL_HOST_PASSWORD to a valid Gmail App Password."
				)
			},
			status=500,
		)
	except Exception as exc:
		return JsonResponse({"error": f"Failed to send email alert: {exc}"}, status=500)

	return JsonResponse(
		{
			"status": "ok",
			"message": "Alert sent successfully",
			"maps_link": maps_link,
			"timestamp": alert.timestamp.isoformat(),
		}
	)
