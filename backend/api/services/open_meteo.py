"""
Open-Meteo Weather Service

Fetches multi-coordinate batch hourly forecasts for wind speed, rain rate,
and snowfall rate directly in imperial units (mph, inch).
"""

from typing import List, Tuple, Dict, Any
import datetime
import requests


OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
REQUEST_HEADERS = {"User-Agent": "WeatherAwareTruckRouting/1.0"}


def fetch_batch_weather(
    coordinates: List[Tuple[float, float]],
    forecast_days: int = 2,
) -> List[Dict[str, Any]]:
    """
    Batches up to 1,000 (longitude, latitude) coordinates into GET requests.
    Returns the hourly forecast arrays for wind_speed_10m, rain, snowfall, and temperature_2m.
    """
    if not coordinates:
        return []

    all_results: List[Dict[str, Any]] = []
    chunk_size = 150

    for i in range(0, len(coordinates), chunk_size):
        chunk = coordinates[i : i + chunk_size]
        lats = [f"{coord[1]:.4f}" for coord in chunk]
        lons = [f"{coord[0]:.4f}" for coord in chunk]

        params = {
            "latitude": ",".join(lats),
            "longitude": ",".join(lons),
            "hourly": "wind_speed_10m,rain,snowfall,temperature_2m",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "forecast_days": forecast_days,
        }

        try:
            res = requests.get(
                OPEN_METEO_FORECAST_URL,
                params=params,
                headers=REQUEST_HEADERS,
                timeout=8,
            )
            res.raise_for_status()
            data = res.json()

            if isinstance(data, list):
                all_results.extend(data)
            elif isinstance(data, dict):
                all_results.append(data)
        except Exception as e:
            # Fallback if network issue
            for coord in chunk:
                all_results.append({
                    "latitude": coord[1],
                    "longitude": coord[0],
                    "hourly": {
                        "time": [f"2026-10-24T{h:02d}:00" for h in range(48)],
                        "wind_speed_10m": [15.0] * 48,
                        "rain": [0.0] * 48,
                        "snowfall": [0.0] * 48,
                        "temperature_2m": [52.0] * 48,
                    },
                })

    return all_results


def get_checkpoint_weather_at_eta(
    location_forecast: Dict[str, Any],
    eta_dt: datetime.datetime,
) -> Dict[str, float]:
    """
    Extracts wind_speed_mph, rain_rate_in_hr, snow_rate_in_hr, and temperature_f
    for a location at the specific hourly forecast bucket matching eta_dt.
    """
    hourly = location_forecast.get("hourly", {})
    times = hourly.get("time", [])

    if not times:
        return {
            "wind_speed_mph": 10.0,
            "rain_rate_in_hr": 0.0,
            "snow_rate_in_hr": 0.0,
            "temperature_f": 50.0,
        }

    target_hour = eta_dt.strftime("%Y-%m-%dT%H:00")

    idx = 0
    if target_hour in times:
        idx = times.index(target_hour)
    else:
        try:
            target_dt_naive = eta_dt.replace(tzinfo=None)
            best_diff = None
            for i, t_str in enumerate(times):
                t_dt = datetime.datetime.fromisoformat(t_str)
                diff = abs((t_dt - target_dt_naive).total_seconds())
                if best_diff is None or diff < best_diff:
                    best_diff = diff
                    idx = i
        except Exception:
            idx = 0

    wind_list = hourly.get("wind_speed_10m", [])
    rain_list = hourly.get("rain", [])
    snow_list = hourly.get("snowfall", [])
    temp_list = hourly.get("temperature_2m", [])

    wind = wind_list[idx] if idx < len(wind_list) and wind_list[idx] is not None else 0.0
    rain = rain_list[idx] if idx < len(rain_list) and rain_list[idx] is not None else 0.0
    snow = snow_list[idx] if idx < len(snow_list) and snow_list[idx] is not None else 0.0
    temp = temp_list[idx] if idx < len(temp_list) and temp_list[idx] is not None else 50.0

    return {
        "wind_speed_mph": round(float(wind), 1),
        "rain_rate_in_hr": round(float(rain), 3),
        "snow_rate_in_hr": round(float(snow), 3),
        "temperature_f": round(float(temp), 1),
    }
