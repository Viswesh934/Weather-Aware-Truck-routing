from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
import hashlib
import datetime

from .services.aws_location import geocode_place, calculate_truck_routes
from .services.evaluation import evaluate_routes_weather_risk
from .services.recommendation import rank_routes
from .services.corridor import generate_corridor_heatmap_matrix


@api_view(["GET", "POST", "HEAD"])
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


@api_view(["POST"])
def evaluate_routes(request):
    """
    Main evaluation pipeline:
    1. Geocode origin & destination using AWS Places V2
    2. Generate 3 truck routes using AWS Routes V2 with load weight
    3. Sample checkpoints at user interval (10 / 25 / 50 miles)
    4. Batch fetch hourly weather from Open-Meteo
    5. Evaluate weather risk and load-weight rollover rules per checkpoint
    6. Rank routes using lexicographical Pareto recommendation logic
    7. Pre-compute 48-hour corridor weather matrix for instant client scrubbing
    """
    data = request.data or {}
    origin_text = data.get("origin", "").strip() or "Chicago, IL"
    dest_text = data.get("destination", "").strip() or "Denver, CO"
    dep_time_iso = data.get("departure_time") or datetime.datetime.now(datetime.timezone.utc).isoformat()
    load_weight_lbs = float(data.get("load_weight_lbs", 35000.0))
    sampling_interval = float(data.get("sampling_interval_miles", 25.0))

    if sampling_interval not in (10.0, 25.0, 50.0):
        sampling_interval = 25.0

    # Cache key based on input parameters (rounded to nearest hour for weather caching)
    cache_str = f"{origin_text.lower()}:{dest_text.lower()}:{dep_time_iso[:13]}:{load_weight_lbs:.0f}:{sampling_interval:.0f}"
    cache_key = "route_eval_" + hashlib.sha256(cache_str.encode()).hexdigest()

    cached_res = cache.get(cache_key)
    if cached_res:
        resp = Response(cached_res, status=status.HTTP_200_OK)
        resp["ETag"] = f'"{cache_key}"'
        resp["Cache-Control"] = "public, max-age=900"
        return resp

    # 1. Geocode Origin & Destination
    origin_coords = geocode_place(origin_text)
    dest_coords = geocode_place(dest_text)

    # 2. Routing (AWS Routes V2 with 3 alternatives)
    raw_routes = calculate_truck_routes(
        origin_coords=origin_coords,
        destination_coords=dest_coords,
        load_weight_lbs=load_weight_lbs,
    )

    if not raw_routes:
        return Response(
            {"error": f"Unable to calculate truck routes between '{origin_text}' and '{dest_text}'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 3 & 4 & 5. Sample checkpoints, query batch weather, evaluate risk & segments
    evaluated_routes, weather_forecasts = evaluate_routes_weather_risk(
        raw_routes=raw_routes,
        departure_time_iso=dep_time_iso,
        load_weight_lbs=load_weight_lbs,
        sampling_interval_miles=sampling_interval,
    )

    # 6. Recommendation Engine (Lexicographical Pareto Ranking)
    recommended_id, reason, ranked_routes = rank_routes(evaluated_routes)

    # 7. Corridor Heatmap Matrix (48-hour frames)
    corridor_heat_frames = generate_corridor_heatmap_matrix(
        corridor_forecasts=weather_forecasts,
        load_weight_lbs=load_weight_lbs,
    )

    response_payload = {
        "recommended_route_id": recommended_id,
        "recommendation_reason": reason,
        "routes": ranked_routes,
        "corridor_heat_frames": corridor_heat_frames,
        "corridor_start_time_utc": dep_time_iso,
    }

    # Cache for 15 minutes
    cache.set(cache_key, response_payload, timeout=900)

    resp = Response(response_payload, status=status.HTTP_200_OK)
    resp["ETag"] = f'"{cache_key}"'
    resp["Cache-Control"] = "public, max-age=900"
    return resp
