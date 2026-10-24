from django.urls import path
from .views import health_check, evaluate_routes

urlpatterns = [
    path("health/", health_check, name="health_check"),
    path("routes/evaluate/", evaluate_routes, name="evaluate_routes"),
]
