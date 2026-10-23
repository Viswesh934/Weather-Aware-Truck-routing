from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import datetime

@api_view(["GET"])
def health_check(request):
    """
    Health check endpoint to verify backend status, timestamp, and environment.
    """
    return Response({
        "status": "healthy",
        "service": "Weather-Aware Truck Routing API",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "version": "1.0.0",
        "features": {
            "routing_provider": "AWS Location Service",
            "weather_provider": "Open-Meteo",
            "risk_engine": "Load-Aware Weather Risk Rules",
            "corridor_forecast": "0-48 Hour Temporal Heatmap",
        }
    }, status=status.HTTP_200_OK)
