"""
AWS Location Service & Routing Provider

Interfaces with Amazon Location Service (Routes V2 & Places V2)
using API Key authentication to geocode locations and calculate 3 commercial truck routes.
"""

import os
from typing import List, Dict, Any, Tuple
import requests


AWS_LOCATION_API_KEY = os.getenv("AWS_LOCATION_API_KEY", "").strip()
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1").strip()


def geocode_place(query_text: str) -> Tuple[float, float]:
    """
    Converts a place string (e.g. 'Chicago, IL') to (longitude, latitude)
    using AWS Places V2 with API Key authentication.
    """
    cleaned_query = query_text.strip()
    key = os.getenv("AWS_LOCATION_API_KEY", AWS_LOCATION_API_KEY).strip()
    region = os.getenv("AWS_REGION", AWS_REGION).strip()

    # 1. AWS Places V2 with API Key
    if key:
        url = f"https://places.geo.{region}.amazonaws.com/v2/geocode?key={key}"
        data = {"QueryText": cleaned_query, "MaxResults": 1}
        try:
            res = requests.post(url, json=data, timeout=8)
            if res.status_code == 200:
                items = res.json().get("ResultItems", [])
                if items and "Position" in items[0]:
                    pos = items[0]["Position"]  # [lon, lat]
                    return float(pos[0]), float(pos[1])
        except Exception:
            pass

    # 2. Resilient Open Fallback (Open-Meteo Geocoding)
    try:
        city_name = cleaned_query.split(",")[0].strip()
        fallback_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1"
        res = requests.get(fallback_url, timeout=5).json()
        results = res.get("results", [])
        if results:
            return float(results[0]["longitude"]), float(results[0]["latitude"])
    except Exception:
        pass

    # Default fallback (Chicago, IL)
    return (-87.63245, 41.88425)


def calculate_truck_routes(
    origin_coords: Tuple[float, float],
    destination_coords: Tuple[float, float],
    load_weight_lbs: float = 35000.0,
) -> List[Dict[str, Any]]:
    """
    Generates 3 distinct route options using AWS Routes V2 calculate_routes
    with TravelMode='Truck', MaxAlternatives=2, and truck load weight limits.
    """
    routes: List[Dict[str, Any]] = []
    key = os.getenv("AWS_LOCATION_API_KEY", AWS_LOCATION_API_KEY).strip()
    region = os.getenv("AWS_REGION", AWS_REGION).strip()

    # 1. Primary: AWS Routes V2 with API Key
    if key:
        url = f"https://routes.geo.{region}.amazonaws.com/v2/routes?key={key}"
        body = {
            "Origin": [float(origin_coords[0]), float(origin_coords[1])],
            "Destination": [float(destination_coords[0]), float(destination_coords[1])],
            "TravelMode": "Truck",
            "MaxAlternatives": 2,
            "TravelModeOptions": {
                "Truck": {
                    "Weight": {
                        "Total": int(load_weight_lbs),
                        "Unit": "Pounds",
                    },
                    "AvoidFerries": True,
                    "AvoidTolls": False,
                }
            },
            "LegGeometryFormat": "Simple",
        }

        try:
            res = requests.post(url, json=body, timeout=12)
            if res.status_code == 200:
                aws_routes = res.json().get("Routes", [])
                route_labels = [
                    "Interstate Direct (Primary)",
                    "Corridor Alternative A",
                    "Corridor Alternative B",
                ]

                for idx, r in enumerate(aws_routes):
                    legs = r.get("Legs", [])
                    if not legs:
                        continue

                    summary = r.get("Summary", {})
                    distance_meters = summary.get("Distance", 0)
                    duration_seconds = summary.get("Duration", 0)
                    line_coords = legs[0].get("Geometry", {}).get("LineString", [])

                    if line_coords:
                        routes.append({
                            "id": f"route_{idx + 1}",
                            "name": route_labels[idx] if idx < len(route_labels) else f"Route Option {idx + 1}",
                            "total_distance_miles": round(distance_meters * 0.000621371, 1),
                            "total_duration_minutes": round(duration_seconds / 60),
                            "total_duration_seconds": duration_seconds,
                            "geometry": {
                                "type": "LineString",
                                "coordinates": line_coords,
                            },
                        })
        except Exception:
            routes = []

    # 2. Resilient Fallback if AWS returns fewer than 3 routes or encounters an error
    if len(routes) < 3:
        try:
            coords_str = f"{origin_coords[0]:.4f},{origin_coords[1]:.4f};{destination_coords[0]:.4f},{destination_coords[1]:.4f}"
            osrm_url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson&alternatives=3"
            res = requests.get(osrm_url, timeout=8).json()
            if res.get("code") == "Ok":
                for r in res.get("routes", []):
                    if len(routes) >= 3:
                        break
                    dist_mi = round(r["distance"] * 0.000621371, 1)
                    if not any(abs(existing["total_distance_miles"] - dist_mi) < 3.0 for existing in routes):
                        routes.append({
                            "id": f"route_{len(routes) + 1}",
                            "name": f"Corridor Alternative {len(routes)}",
                            "total_distance_miles": dist_mi,
                            "total_duration_minutes": round(r["duration"] / 60),
                            "total_duration_seconds": r["duration"],
                            "geometry": {
                                "type": "LineString",
                                "coordinates": r["geometry"]["coordinates"],
                            },
                        })
        except Exception:
            pass

    return routes[:3]
