from django.contrib import admin
from django.urls import path, re_path, include
from api.views import health_check

urlpatterns = [
    re_path(r"^/?$", health_check, name="root_health"),
    re_path(r"^health/?$", health_check, name="direct_health"),
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]
