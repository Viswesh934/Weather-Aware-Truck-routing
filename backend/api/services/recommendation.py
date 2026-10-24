"""
Route Recommendation & Ranking Engine (Step 3)

Ranks evaluated routes based on strict lexicographical prioritization:
1. Fewest Severe miles (and No Travel miles)
2. Fewest High miles
3. Lowest average risk
4. Shortest travel times
"""

from typing import List, Dict, Any, Tuple


def generate_recommendation_reason(
    recommended_route: Dict[str, Any],
    all_routes: List[Dict[str, Any]],
) -> str:
    """
    Synthesizes clear, driver-friendly dispatch advice in plain English.
    """
    rec_sum = recommended_route.get("risk_summary", {})
    rec_sev = rec_sum.get("severe_miles", 0.0) + rec_sum.get("no_travel_miles", 0.0)
    rec_high = rec_sum.get("high_miles", 0.0)

    other_routes = [r for r in all_routes if r.get("id") != recommended_route.get("id")]
    max_other_sev = max(
        (r.get("risk_summary", {}).get("severe_miles", 0.0) + r.get("risk_summary", {}).get("no_travel_miles", 0.0)
         for r in other_routes),
        default=0.0,
    )
    max_other_high = max(
        (r.get("risk_summary", {}).get("high_miles", 0.0) for r in other_routes),
        default=0.0,
    )

    if rec_sev == 0 and max_other_sev > 0:
        return (
            f"Recommended: Completely avoids {max_other_sev:.0f} miles of Severe weather and high winds "
            f"found on the other highway options, with virtually no extra drive time."
        )

    if rec_sev < max_other_sev:
        saved_sev = max_other_sev - rec_sev
        return f"Safest path: Keeps you out of {saved_sev:.0f} miles of severe weather compared to alternative routes."

    if rec_high == 0 and max_other_high > 0:
        return (
            f"Best choice: Clear skies and safe winds the entire way, avoiding {max_other_high:.0f} miles of "
            f"gusty crosswinds on the other roads."
        )

    if rec_high < max_other_high:
        return (
            f"Recommended for easiest driving: Only {rec_high:.0f} miles of noticeable wind vs {max_other_high:.0f} miles "
            f"on alternative corridors."
        )

    return "Best route: Optimal driving conditions with the shortest travel time and light weather along the highway."


def rank_routes(evaluated_routes: List[Dict[str, Any]]) -> Tuple[str, str, List[Dict[str, Any]]]:
    """
    Ranks routes using strict lexicographical sorting:
    1. Fewest Severe miles (and No Travel miles)
    2. Fewest High miles
    3. Lowest average risk
    4. Shortest travel times

    Returns:
    - recommended_route_id (str)
    - recommendation_reason (str)
    - sorted_routes (List[Dict])
    """
    if not evaluated_routes:
        return "", "", []

    def sort_key(route: Dict[str, Any]):
        summary = route.get("risk_summary", {})
        no_travel_miles = summary.get("no_travel_miles", 0.0)
        severe_miles = summary.get("severe_miles", 0.0)
        high_miles = summary.get("high_miles", 0.0)
        avg_score = route.get("average_risk_score", 1.0)
        duration = route.get("total_duration_seconds", 0)

        # Lexicographical tuple:
        # 1. Total dangerous miles (No Travel + Severe)
        # 2. No Travel miles specifically
        # 3. High miles
        # 4. Average risk score
        # 5. Travel duration in seconds
        return (
            no_travel_miles + severe_miles,
            no_travel_miles,
            high_miles,
            avg_score,
            duration,
        )

    sorted_routes = sorted(evaluated_routes, key=sort_key)

    for i, r in enumerate(sorted_routes):
        r["is_recommended"] = (i == 0)

    recommended = sorted_routes[0]
    reason = generate_recommendation_reason(recommended, sorted_routes)

    return recommended["id"], reason, sorted_routes
