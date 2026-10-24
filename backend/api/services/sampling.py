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


def _interpolate_coords(
    p1: Tuple[float, float],
    p2: Tuple[float, float],
    fraction: float,
) -> Tuple[float, float]:
    """
    Linearly interpolates between two (lon, lat) points by fraction (0.0 to 1.0).
    """
    lon1, lat1 = p1
    lon2, lat2 = p2
    return (
        round(lon1 + (lon2 - lon1) * fraction, 5),
        round(lat1 + (lat2 - lat1) * fraction, 5),
    )


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
    if not coordinates or len(coordinates) < 2:
        return []

    # Parse departure time
    try:
        clean_iso = departure_time_iso.replace("Z", "+00:00")
        if "+" not in clean_iso and "-" not in clean_iso[10:]:
            dep_dt = datetime.datetime.fromisoformat(clean_iso).replace(tzinfo=datetime.timezone.utc)
        else:
            dep_dt = datetime.datetime.fromisoformat(clean_iso)
    except Exception:
        dep_dt = datetime.datetime.now(datetime.timezone.utc)

    # 1. Precalculate cumulative distances along all vertices
    segment_lengths = []
    cumulative_distances = [0.0]
    total_dist = 0.0

    for i in range(len(coordinates) - 1):
        seg_len = haversine_miles(coordinates[i], coordinates[i + 1])
        segment_lengths.append(seg_len)
        total_dist += seg_len
        cumulative_distances.append(total_dist)

    if total_dist == 0:
        return []

    checkpoints: List[Dict[str, Any]] = []

    # Checkpoint 0: Origin (Mile 0.0)
    checkpoints.append({
        "index": 0,
        "distance_from_origin_miles": 0.0,
        "coordinates": [coordinates[0][0], coordinates[0][1]],  # [lon, lat]
        "eta_utc": dep_dt.isoformat(),
        "eta_dt": dep_dt,
        "eta_local_display": dep_dt.strftime("%a %I:%M %p"),
    })

    target_distance = interval_miles
    current_vertex_idx = 0

    while target_distance < total_dist:
        # Find which segment contains target_distance
        while (
            current_vertex_idx < len(segment_lengths)
            and cumulative_distances[current_vertex_idx + 1] < target_distance
        ):
            current_vertex_idx += 1

        if current_vertex_idx >= len(segment_lengths):
            break

        seg_start_dist = cumulative_distances[current_vertex_idx]
        seg_len = segment_lengths[current_vertex_idx]

        fraction = 0.0
        if seg_len > 0:
            fraction = (target_distance - seg_start_dist) / seg_len
        fraction = max(0.0, min(1.0, fraction))

        interp_lon, interp_lat = _interpolate_coords(
            coordinates[current_vertex_idx],
            coordinates[current_vertex_idx + 1],
            fraction,
        )

        # ETA based on proportion of total distance
        travel_fraction = target_distance / total_dist
        elapsed_seconds = travel_fraction * total_duration_seconds
        point_eta = dep_dt + datetime.timedelta(seconds=elapsed_seconds)

        checkpoints.append({
            "index": len(checkpoints),
            "distance_from_origin_miles": round(target_distance, 1),
            "coordinates": [interp_lon, interp_lat],
            "eta_utc": point_eta.isoformat(),
            "eta_dt": point_eta,
            "eta_local_display": point_eta.strftime("%a %I:%M %p"),
        })

        target_distance += interval_miles

    # Terminal Checkpoint: Destination
    dest_eta = dep_dt + datetime.timedelta(seconds=total_duration_seconds)
    checkpoints.append({
        "index": len(checkpoints),
        "distance_from_origin_miles": round(total_dist, 1),
        "coordinates": [coordinates[-1][0], coordinates[-1][1]],
        "eta_utc": dest_eta.isoformat(),
        "eta_dt": dest_eta,
        "eta_local_display": dest_eta.strftime("%a %I:%M %p"),
    })

    return checkpoints
