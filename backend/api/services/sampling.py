"""
Spatiotemporal Polyline Sampler

Discretizes raw highway polyline coordinates into uniform distance intervals
(10, 25, or 50 miles) and calculates arrival timestamps (ETA) for each checkpoint.
"""

from typing import List, Tuple, Dict, Any
import datetime
import math


def haversine_miles(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Computes great-circle distance between two (lon, lat) points in miles.
    """
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    r = 3958.8  # Earth radius in miles

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def sample_route_checkpoints(
    coordinates: List[Tuple[float, float]],
    total_duration_seconds: float,
    departure_time_iso: str,
    interval_miles: float = 25.0,
) -> List[Dict[str, Any]]:
    """
    Interpolates checkpoints every `interval_miles` along the route coordinates.
    Computes distance from origin and estimated arrival time (ETA) for each point.
    """
    # STUB: To be implemented tomorrow
    # Returns list of checkpoint dictionaries with coordinates, distance, and ETA
    return []
