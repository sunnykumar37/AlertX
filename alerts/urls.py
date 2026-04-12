from django.urls import path

from .views import dashboard_view, login_view, logout_view, register_view, send_sos_view

urlpatterns = [
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("", dashboard_view, name="dashboard"),
    path("register/", register_view, name="register"),
    path("send-sos", send_sos_view, name="send_sos"),
]
