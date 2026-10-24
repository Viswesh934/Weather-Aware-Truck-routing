from django.urls import re_path
from .views import health_check, evaluate_routes

urlpatterns = [
    re_path(r"^health/?$", health_check, name="health_check"),
    re_path(r"^routes/evaluate/?$", evaluate_routes, name="evaluate_routes"),
]
