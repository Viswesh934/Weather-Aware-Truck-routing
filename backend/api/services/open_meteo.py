"""
Open-Meteo Weather Service

Fetches multi-coordinate batch hourly forecasts for wind speed, rain rate,
and snowfall rate directly in imperial units (mph, inch).
"""

from typing import List, Tuple, Dict, Any
import requests


OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


def fetch_batch_weather(
    coordinates: List[Tuple[float, float]],
    forecast_days: int = 2,
) -> List[Dict[str, Any]]:
    """
    Batches up to 1,000 (longitude, latitude) coordinates into a single GET request.
    Returns the hourly forecast arrays for wind_speed_10m, rain, and snowfall.
    """
    # STUB: To be implemented tomorrow
    return []


def get_checkpoint_weather_at_eta(
    location_forecast: Dict[str, Any],
    eta_iso: str,
    forecast_start_iso: str,
) -> Dict[str, float]:
    """
    Extracts wind_speed_mph, rain_rate_in_hr, and snow_rate_in_hr
    for a location at the specific hourly forecast bucket matching eta_iso.
    """
    # STUB: To be implemented tomorrow
    return {
        "wind_speed_mph": 0.0,
        "rain_rate_in_hr": 0.0,
        "snow_rate_in_hr": 0.0,
    }
