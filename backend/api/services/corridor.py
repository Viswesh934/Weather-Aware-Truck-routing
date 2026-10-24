"""
Corridor Weather Heatmap Service (Step 3)

Generates a spatial bounding grid along the trip corridor and packages
the 48-hour hourly weather forecast matrix for client-side zero-lag rendering.
"""

from typing import List, Dict, Any
from api.services.risk_engine import evaluate_checkpoint_risk


def generate_corridor_heatmap_matrix(
    corridor_forecasts: List[Dict[str, Any]],
    load_weight_lbs: float = 35000.0,
) -> List[List[List[float]]]:
    """
    Computes a 48-hour array of frames from the corridor forecasts.
    Each frame contains [[latitude, longitude, normalized_intensity], ...] for that specific hour.
    """
    if not corridor_forecasts:
        return [[] for _ in range(48)]

    # Determine number of hours available (up to 48)
    first_hourly = corridor_forecasts[0].get("hourly", {})
    available_hours = min(48, len(first_hourly.get("time", [])))
    if available_hours == 0:
        available_hours = 48

    corridor_heat_frames: List[List[List[float]]] = []

    for hour_idx in range(available_hours):
        frame_points: List[List[float]] = []

        for loc_data in corridor_forecasts:
            lat = float(loc_data.get("latitude", 0.0))
            lon = float(loc_data.get("longitude", 0.0))
            hourly = loc_data.get("hourly", {})

            wind_list = hourly.get("wind_speed_10m", [])
            rain_list = hourly.get("rain", [])
            snow_list = hourly.get("snowfall", [])

            wind = wind_list[hour_idx] if hour_idx < len(wind_list) and wind_list[hour_idx] is not None else 10.0
            rain = rain_list[hour_idx] if hour_idx < len(rain_list) and rain_list[hour_idx] is not None else 0.0
            snow = snow_list[hour_idx] if hour_idx < len(snow_list) and snow_list[hour_idx] is not None else 0.0

            # Evaluate composite risk
            risk = evaluate_checkpoint_risk(
                wind_mph=float(wind),
                rain_in_hr=float(rain),
                snow_in_hr=float(snow),
                load_weight_lbs=load_weight_lbs,
            )

            # Intensity normalization (0.2 for Low up to 1.0 for No Travel)
            score = risk["score"]
            if score == 1:
                intensity = 0.2
            elif score == 2:
                intensity = 0.4
            elif score == 3:
                intensity = 0.65
            elif score == 4:
                intensity = 0.85
            else:
                intensity = 1.0

            frame_points.append([lat, lon, intensity])

        corridor_heat_frames.append(frame_points)

    # Pad up to 48 frames if needed
    while len(corridor_heat_frames) < 48:
        corridor_heat_frames.append(corridor_heat_frames[-1] if corridor_heat_frames else [])

    return corridor_heat_frames
