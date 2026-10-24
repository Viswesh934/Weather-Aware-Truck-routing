from django.contrib import admin
from django.urls import path, include
from api.views import health_check

urlpatterns = [
    path("", health_check, name="root_health"),
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]
