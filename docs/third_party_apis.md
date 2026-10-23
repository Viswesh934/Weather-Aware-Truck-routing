# Third-Party API Specifications

This document outlines the exact integration patterns, parameter structures, units, and fallbacks for all external APIs utilized in the **Weather-Aware Truck Routing** application.

---

## 1. AWS Location Service (`geo-routes` & `geo-places`)

### A. Route Generation (`geo-routes`)
- **SDK Client**: `boto3.client('geo-routes', region_name=AWS_REGION)`
- **Operation**: `calculate_routes`
- **Purpose**: Generates 3 viable commercial truck routes between origin and destination, respecting bridge clearances and gross vehicle weight constraints.

#### Request Parameters
```python
response = client.calculate_routes(
    Origin=[origin_lon, origin_lat],          # [Longitude, Latitude]
    Destination=[dest_lon, dest_lat],        # [Longitude, Latitude]
    TravelMode='Truck',                      # Truck-specific navigation
    MaxAlternatives=2,                       # 1 Primary + 2 Alternatives = 3 Total Routes
    TravelModeOptions={
        'Truck': {
            'Weight': {
                'Total': int(load_weight_lbs),  # Gross weight for bridge ratings
                'Unit': 'Pounds'
            },
            'AvoidFerries': True,
            'AvoidTolls': False
        }
    },
    LegGeometryFormat='Simple'               # Direct GeoJSON LineString coordinates [[lon, lat], ...]
)
```

#### Key Output Fields
- `Routes[i].Summary.DistanceMeters`: Total route distance (converted to miles: $\times 0.000621371$).
- `Routes[i].Summary.DurationSeconds`: Total transit duration in seconds.
- `Routes[i].Legs[0].Geometry.LineString`: Ordered list of `[lon, lat]` floating-point coordinates along the highway corridor.

---

### B. Geocoding (`geo-places`)
- **SDK Client**: `boto3.client('geo-places', region_name=AWS_REGION)`
- **Operation**: `geocode` or `search_text`
- **Purpose**: Converts textual place names (e.g. `"Chicago, IL"`, `"Denver, CO"`) into validated `[longitude, latitude]` pairs.

#### Request Parameters
```python
response = client.geocode(
    QueryText="Chicago, IL",
    MaxResults=1
)
coordinates = response['ResultItems'][0]['Position']  # [lon, lat]
```

#### Resilient Fallback Strategy
If AWS credentials are unset or AWS rate limits are encountered during evaluation:
- **Routing Fallback**: OSRM / OpenRouteService engine generating alternative corridors (e.g. via alternative highway profiles or via-point corridor perturbation).
- **Geocoding Fallback**: Open-Meteo Geocoding API (`https://geocoding-api.open-meteo.com/v1/search?name=...&count=1`).

---

## 2. Open-Meteo Weather API

- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Method**: `GET`
- **Purpose**: High-resolution hourly atmospheric forecast for all route checkpoints and the corridor bounding envelope.

#### Request Parameters
```http
GET https://api.open-meteo.com/v1/forecast?
    latitude=41.8781,41.5868,41.2565,...&
    longitude=-87.6298,-93.6250,-95.9345,...&
    hourly=wind_speed_10m,rain,snowfall&
    wind_speed_unit=mph&
    precipitation_unit=inch&
    forecast_days=2
```

#### Parameter Breakdown
| Parameter | Value | Reason |
| :--- | :--- | :--- |
| `latitude` | Comma-separated floats | Batches up to 1,000 checkpoints in a single round-trip |
| `longitude` | Comma-separated floats | Matches order of latitude points |
| `hourly` | `wind_speed_10m,rain,snowfall` | Atmospheric conditions mandated by project risk rules |
| `wind_speed_unit` | `mph` | Matches project wind thresholds ($<25, 25\text{–}34, 35\text{–}44, 45\text{–}54, \ge 55\text{ mph}$) |
| `precipitation_unit` | `inch` | Matches project rain ($<0.10, 0.10\text{–}0.25, \dots$) and snow ($<0.5, \dots$) thresholds |
| `forecast_days` | `2` | Supplies 48 consecutive hourly forecast steps for the corridor timeline scrubber |

#### Response Structure
When multiple coordinates are passed, Open-Meteo returns an **array of location objects**:
```json
[
  {
    "latitude": 41.8781,
    "longitude": -87.6298,
    "hourly": {
      "time": ["2026-10-23T00:00", "2026-10-23T01:00", ...],
      "wind_speed_10m": [12.4, 14.1, ...],
      "rain": [0.0, 0.05, ...],
      "snowfall": [0.0, 0.0, ...]
    }
  },
  ...
]
```

#### Temporal Index Alignment Formula
For checkpoint $k$ with arrival time $\text{ETA}_k$:
1. Calculate elapsed hours from forecast start:
   $$\Delta h_k = \left\lfloor \frac{\text{ETA}_k - T_{\text{forecast\_start}}}{3600\text{ seconds}} \right\rfloor$$
2. Clamp $\Delta h_k \in [0, 47]$.
3. Extract checkpoint weather at index $\Delta h_k$:
   - $\text{Wind} = \text{wind\_speed\_10m}[\Delta h_k]$
   - $\text{Rain} = \text{rain}[\Delta h_k]$
   - $\text{Snow} = \text{snowfall}[\Delta h_k]$
