"""
Route Weather & Risk Evaluation Pipeline (Step 2)

Orchestrates checkpoint sampling, batch weather querying, and
load-dependent risk assessment across all generated truck routes.
"""

from typing import List, Dict, Any, Tuple
from api.services.sampling import sample_route_checkpoints
from api.services.open_meteo import fetch_batch_weather, get_checkpoint_weather_at_eta
from api.services.risk_engine import evaluate_checkpoint_risk


def calculate_route_risk_mileage(
    checkpoints: List[Dict[str, Any]],
    total_distance_miles: float,
) -> Tuple[Dict[str, float], float]:
    """
    Computes mileage breakdown for each risk tier and average risk score.
    Low, Moderate, High, Severe, No Travel miles sum to total distance.
    """
    if not checkpoints:
        return {
            "low_miles": 0.0,
            "moderate_miles": 0.0,
            "high_miles": 0.0,
            "severe_miles": 0.0,
            "no_travel_miles": 0.0,
        }, 1.0

    scores = [cp["risk"]["score"] for cp in checkpoints]
    avg_score = round(sum(scores) / len(scores), 2)

    risk_miles = {
        "Low": 0.0,
        "Moderate": 0.0,
        "High": 0.0,
        "Severe": 0.0,
        "No Travel": 0.0,
    }

    n = len(checkpoints)
    if n == 1:
        risk_miles[checkpoints[0]["risk"]["level"]] = total_distance_miles
    else:
        for i in range(n - 1):
            d_start = checkpoints[i]["distance_from_origin_miles"]
            d_end = checkpoints[i + 1]["distance_from_origin_miles"]
            span = max(0.0, d_end - d_start)

            # Segment risk is the higher risk of the two endpoints
            score_i = checkpoints[i]["risk"]["score"]
            score_next = checkpoints[i + 1]["risk"]["score"]
            dominant_level = checkpoints[i]["risk"]["level"] if score_i >= score_next else checkpoints[i + 1]["risk"]["level"]

            risk_miles[dominant_level] += span

    return {
        "low_miles": round(risk_miles["Low"], 1),
        "moderate_miles": round(risk_miles["Moderate"], 1),
        "high_miles": round(risk_miles["High"], 1),
        "severe_miles": round(risk_miles["Severe"], 1),
        "no_travel_miles": round(risk_miles["No Travel"], 1),
    }, avg_score


def evaluate_routes_weather_risk(
    raw_routes: List[Dict[str, Any]],
    departure_time_iso: str,
    load_weight_lbs: float = 35000.0,
    sampling_interval_miles: float = 25.0,
    prefetched_weather: List[Dict[str, Any]] = None,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Step 2 Pipeline:
    1. Samples checkpoints for each route.
    2. Collects unique coordinates and fetches batch weather from Open-Meteo (or uses prefetched).
    3. Evaluates checkpoint weather at exact ETA.
    4. Evaluates risk with load physics rules.
    5. Computes risk mileage summary and colored polyline segments.

    Returns:
    - evaluated_routes: List of routes with evaluated checkpoints & risk summaries.
    - weather_forecasts: The raw batch weather forecasts for corridor heatmap generation.
    """
    routes_with_cps = []
    all_coords: List[Tuple[float, float]] = []

    for r in raw_routes:
        cps = sample_route_checkpoints(
            coordinates=r["geometry"]["coordinates"],
            total_duration_seconds=r["total_duration_seconds"],
            departure_time_iso=departure_time_iso,
            interval_miles=sampling_interval_miles,
        )
        r_copy = dict(r)
        r_copy["checkpoints"] = cps
        routes_with_cps.append(r_copy)

        for cp in cps:
            all_coords.append((cp["coordinates"][0], cp["coordinates"][1]))

    # Deduplicate coordinates for batch query
    unique_coords: List[Tuple[float, float]] = []
    coord_set = set()
    for lon, lat in all_coords:
        key = (round(lon, 3), round(lat, 3))
        if key not in coord_set:
            coord_set.add(key)
            unique_coords.append((lon, lat))

    # Fetch batch weather
    if prefetched_weather is not None:
        weather_forecasts = prefetched_weather
    else:
        weather_forecasts = fetch_batch_weather(unique_coords, forecast_days=2)

    # Index forecasts by rounded coordinate
    forecast_map = {}
    for loc_data in weather_forecasts:
        flat = round(float(loc_data.get("latitude", 0.0)), 3)
        flon = round(float(loc_data.get("longitude", 0.0)), 3)
        forecast_map[(flon, flat)] = loc_data

    evaluated_routes = []
    for r in routes_with_cps:
        evaluated_cps = []
        for cp in r["checkpoints"]:
            c_lon, c_lat = cp["coordinates"]
            f_key = (round(c_lon, 3), round(c_lat, 3))
            loc_forecast = forecast_map.get(f_key, weather_forecasts[0] if weather_forecasts else {})

            weather = get_checkpoint_weather_at_eta(loc_forecast, cp["eta_dt"])

            risk = evaluate_checkpoint_risk(
                wind_mph=weather["wind_speed_mph"],
                rain_in_hr=weather["rain_rate_in_hr"],
                snow_in_hr=weather["snow_rate_in_hr"],
                load_weight_lbs=load_weight_lbs,
            )

            evaluated_cps.append({
                "index": cp["index"],
                "distance_from_origin_miles": cp["distance_from_origin_miles"],
                "coordinates": cp["coordinates"],
                "eta_utc": cp["eta_utc"],
                "eta_local_display": cp["eta_local_display"],
                "weather": weather,
                "risk": risk,
            })

        risk_summary, avg_risk = calculate_route_risk_mileage(
            checkpoints=evaluated_cps,
            total_distance_miles=r["total_distance_miles"],
        )

        r["checkpoints"] = evaluated_cps
        r["risk_summary"] = risk_summary
        r["average_risk_score"] = avg_risk

        # Build segments for map line risk coloring
        segments = []
        for i in range(len(evaluated_cps) - 1):
            cp1 = evaluated_cps[i]
            cp2 = evaluated_cps[i + 1]
            seg_dist = max(0.0, cp2["distance_from_origin_miles"] - cp1["distance_from_origin_miles"])
            dom_risk = cp1["risk"] if cp1["risk"]["score"] >= cp2["risk"]["score"] else cp2["risk"]

            segments.append({
                "coordinates": [cp1["coordinates"], cp2["coordinates"]],
                "risk_level": dom_risk["level"],
                "risk_color": dom_risk["color"],
                "distance_miles": round(seg_dist, 1),
            })
        r["segments"] = segments

        evaluated_routes.append(r)

    return evaluated_routes, weather_forecasts
