"""
Risk & Load Rules Engine

Evaluates weather conditions (wind speed, rain rate, snowfall rate) and
truck load weight to determine checkpoint risk level, numeric score,
and limiting atmospheric factors according to project safety specifications.
"""

from enum import IntEnum
from typing import Dict, Any, Optional


class RiskScore(IntEnum):
    LOW = 1
    MODERATE = 2
    HIGH = 3
    SEVERE = 4
    NO_TRAVEL = 5


RISK_METADATA = {
    RiskScore.LOW: {
        "level": "Low",
        "score": 1,
        "color": "#10b981",
        "description": "Safe driving conditions.",
    },
    RiskScore.MODERATE: {
        "level": "Moderate",
        "score": 2,
        "color": "#3b82f6",
        "description": "Caution advised. Moderate weather present.",
    },
    RiskScore.HIGH: {
        "level": "High",
        "score": 3,
        "color": "#f59e0b",
        "description": "Hazardous driving conditions. Increased rollover/hydroplaning risk.",
    },
    RiskScore.SEVERE: {
        "level": "Severe",
        "score": 4,
        "color": "#f97316",
        "description": "Dangerous weather. High rollover/traction loss risk.",
    },
    RiskScore.NO_TRAVEL: {
        "level": "No Travel",
        "score": 5,
        "color": "#ef4444",
        "description": "Hazardous road conditions. Commercial truck travel prohibited.",
    },
}


def classify_wind(wind_mph: float) -> RiskScore:
    """
    Wind risk thresholds (mph):
    Low: < 25
    Moderate: 25 - 34
    High: 35 - 44
    Severe: 45 - 54
    No Travel: >= 55
    """
    if wind_mph >= 55.0:
        return RiskScore.NO_TRAVEL
    if wind_mph >= 45.0:
        return RiskScore.SEVERE
    if wind_mph >= 35.0:
        return RiskScore.HIGH
    if wind_mph >= 25.0:
        return RiskScore.MODERATE
    return RiskScore.LOW


def classify_rain(rain_in_hr: float) -> RiskScore:
    """
    Rain risk thresholds (in/hr):
    Low: < 0.10
    Moderate: 0.10 - 0.25
    High: 0.25 - 0.50
    Severe: 0.50 - 1.00
    No Travel: > 1.00
    """
    if rain_in_hr > 1.00:
        return RiskScore.NO_TRAVEL
    if rain_in_hr >= 0.50:
        return RiskScore.SEVERE
    if rain_in_hr >= 0.25:
        return RiskScore.HIGH
    if rain_in_hr >= 0.10:
        return RiskScore.MODERATE
    return RiskScore.LOW


def classify_snow(snow_in_hr: float) -> RiskScore:
    """
    Snow risk thresholds (in/hr):
    Low: < 0.5
    Moderate: 0.5 - 1.0
    High: 1.0 - 2.0
    Severe: 2.0 - 3.0
    No Travel: > 3.0
    """
    if snow_in_hr > 3.0:
        return RiskScore.NO_TRAVEL
    if snow_in_hr >= 2.0:
        return RiskScore.SEVERE
    if snow_in_hr >= 1.0:
        return RiskScore.HIGH
    if snow_in_hr >= 0.5:
        return RiskScore.MODERATE
    return RiskScore.LOW


def apply_load_rules(wind_mph: float, load_weight_lbs: float, current_wind_risk: RiskScore) -> tuple[RiskScore, Optional[str]]:
    """
    Load weight rules:
    - >= 55 mph -> No Travel for any load
    - 45–54 mph + > 30,000 lb -> No Travel
    - 35–44 mph + > 40,000 lb -> Severe
    """
    # Rule 1: >= 55 mph -> No Travel for any load
    if wind_mph >= 55.0:
        return RiskScore.NO_TRAVEL, "Wind >= 55 mph (No Travel for any load)"

    # Rule 2: 45-54 mph + > 30,000 lb -> No Travel
    if 45.0 <= wind_mph < 55.0 and load_weight_lbs > 30000:
        return RiskScore.NO_TRAVEL, f"Wind ({wind_mph:.1f} mph) + Weight ({load_weight_lbs:,.0f} lb > 30,000 lb) escalated to No Travel"

    # Rule 3: 35-44 mph + > 40,000 lb -> Severe
    if 35.0 <= wind_mph < 45.0 and load_weight_lbs > 40000:
        if current_wind_risk < RiskScore.SEVERE:
            return RiskScore.SEVERE, f"Wind ({wind_mph:.1f} mph) + Weight ({load_weight_lbs:,.0f} lb > 40,000 lb) escalated to Severe"

    return current_wind_risk, None


def evaluate_checkpoint_risk(
    wind_mph: float,
    rain_in_hr: float,
    snow_in_hr: float,
    load_weight_lbs: float = 0.0,
) -> Dict[str, Any]:
    """
    Evaluates weather risk at a single checkpoint, applying condition thresholds
    and weight-specific overrides. Returns comprehensive risk metrics and reasons.
    """
    raw_wind_risk = classify_wind(wind_mph)
    rain_risk = classify_rain(rain_in_hr)
    snow_risk = classify_snow(snow_in_hr)

    # Apply load physics to wind risk
    effective_wind_risk, load_rule_triggered = apply_load_rules(
        wind_mph=wind_mph,
        load_weight_lbs=load_weight_lbs,
        current_wind_risk=raw_wind_risk,
    )

    # Determine maximum risk across all hazards
    hazard_risks = {
        "Wind": effective_wind_risk,
        "Rain": rain_risk,
        "Snow": snow_risk,
    }

    final_score = max(hazard_risks.values())

    # Find which factors caused the max risk
    limiting_factors = [hazard for hazard, score in hazard_risks.items() if score == final_score]

    meta = RISK_METADATA[final_score]

    return {
        "level": meta["level"],
        "score": int(final_score),
        "color": meta["color"],
        "limiting_factors": limiting_factors,
        "load_override_applied": load_rule_triggered is not None,
        "load_rule_description": load_rule_triggered,
        "breakdown": {
            "wind": {
                "value_mph": wind_mph,
                "raw_risk": RISK_METADATA[raw_wind_risk]["level"],
                "effective_risk": RISK_METADATA[effective_wind_risk]["level"],
            },
            "rain": {
                "value_in_hr": rain_in_hr,
                "risk": RISK_METADATA[rain_risk]["level"],
            },
            "snow": {
                "value_in_hr": snow_in_hr,
                "risk": RISK_METADATA[snow_risk]["level"],
            },
        },
    }
