from django.contrib import admin
from .models import EmergencyContact, SOSAlert


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
	list_display = ("user", "email", "is_primary", "created_at")
	list_filter = ("is_primary",)
	search_fields = ("user__username", "email")


@admin.register(SOSAlert)
class SOSAlertAdmin(admin.ModelAdmin):
	list_display = ("user", "timestamp", "latitude", "longitude")
	list_filter = ("timestamp",)
	search_fields = ("user__username",)
