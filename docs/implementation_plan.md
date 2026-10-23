# 2-Hour Implementation Plan (Tomorrow's Blueprint)

This document outlines the exact execution sequence to build out the full application in **2 hours tomorrow**. All file structures, stubs, dependencies, and types are already in place.

---

## Timeline & Milestones (120 Minutes)

```
[00:00 - 00:25] Milestone 1: AWS Routing & Spatiotemporal Polyline Sampling
[00:25 - 00:50] Milestone 2: Open-Meteo Batching & Checkpoint ETA Weather Matcher
[00:50 - 01:15] Milestone 3: Route Recommendation Engine & 48h Corridor Matrix
[01:15 - 01:35] Milestone 4: Backend View Integration (/api/routes/evaluate/) & Tests
[01:35 - 01:55] Milestone 5: Frontend Zustand Store Wiring & Map Polish
[01:55 - 02:00] Milestone 6: Final Verification & Walkthrough Rehearsal
```

---

### Milestone 1: AWS Routing & Spatiotemporal Sampling (25 Mins)
* **Target Files**:
  - `backend/api/services/aws_location.py`
  - `backend/api/services/sampling.py`
* **Tasks**:
  1. Complete `calculate_truck_routes()`: Call `boto3.client('geo-routes')` with `MaxAlternatives=2`, `TravelMode='Truck'`, and `load_weight_lbs`. Add resilient fallback routes if AWS keys are not supplied.
  2. Complete `sample_route_checkpoints()`: Walk polyline coordinates using Haversine formula; generate checkpoints at exact 10, 25, or 50 mile intervals.
  3. Interpolate arrival timestamps:
     $$\text{ETA}_k = T_{\text{departure}} + \left(\frac{D_k}{D_{\text{total}}}\right) \times \text{Duration}_{\text{total}}$$
* **Verification**: Run unit test verifying checkpoints generated for Chicago $\rightarrow$ Denver match distance intervals and cumulative time.

---

### Milestone 2: Open-Meteo Weather Integration (25 Mins)
* **Target Files**:
  - `backend/api/services/open_meteo.py`
* **Tasks**:
  1. Complete `fetch_batch_weather()`: Form comma-separated `latitude` and `longitude` string from all checkpoints across all 3 routes; call Open-Meteo with `wind_speed_unit=mph&precipitation_unit=inch&forecast_days=2`.
  2. Complete `get_checkpoint_weather_at_eta()`: For each checkpoint, compute elapsed hour $\Delta h = \lfloor(\text{ETA} - T_0)/3600\rfloor$; extract wind speed, rain rate, and snow rate.
  3. Pipe weather data into `evaluate_checkpoint_risk()` to classify risk and detect load overrides.
* **Verification**: Print sample checkpoint risk results for high-wind/snow coordinates.

---

### Milestone 3: Recommendation Engine & Corridor Heatmap (25 Mins)
* **Target Files**:
  - `backend/api/services/recommendation.py`
  - `backend/api/services/corridor.py`
* **Tasks**:
  1. Complete `rank_routes()`: Compute total miles for Low, Moderate, High, Severe, and No Travel. Calculate weighted average risk score. Sort routes using:
     $$\text{SortKey} = (\text{no\_travel\_miles}, \; \text{severe\_miles}, \; \text{high\_miles}, \; \overline{\text{risk}}, \; \text{duration})$$
  2. Generate driver-facing recommendation explanation string.
  3. Complete `generate_corridor_heatmap_matrix()`: Generate spatial bounding corridor grid; pre-calculate the 48-hour normalized intensity array for instant client scrubbing.
* **Verification**: Verify route with Severe miles is ranked lower than route with 0 Severe miles even if shorter.

---

### Milestone 4: Backend REST View & End-to-End Test (20 Mins)
* **Target Files**:
  - `backend/api/views.py`
  - `backend/api/urls.py`
* **Tasks**:
  1. Implement `evaluate_routes` API view in `views.py`.
  2. Handle input validation (`origin`, `destination`, `departure_time`, `load_weight_lbs`, `sampling_interval_miles`).
  3. Implement Django `LocMemCache` caching based on request hash.
* **Verification**: `curl -X POST http://127.0.0.1:8000/api/routes/evaluate/` returns full 3-route payload with corridor frames in $< 800\text{ms}$.

---

### Milestone 5: Frontend Wiring & Map Smoothness (20 Mins)
* **Target Files**:
  - `frontend/src/store/useTripStore.ts`
  - `frontend/src/components/MapViewport.tsx`
  - `frontend/src/components/HeatmapLayer.tsx`
* **Tasks**:
  1. Connect `DispatchForm` "Evaluate Routes" button to `useTripStore.evaluateRoutes()`.
  2. Auto-fit Leaflet map bounds to selected route coordinates.
  3. Verify 0–48h timeline scrubber updates `HeatmapLayer` at 60fps with zero network requests.
  4. Test clicking checkpoints to verify popover HUD displays ETA, weather, and load rules.

---

### Milestone 6: Final Polish & Loom Rehearsal (5 Mins)
* **Tasks**:
  1. Test all 3 pre-configured scenario presets (Chicago $\rightarrow$ Denver, Dallas $\rightarrow$ Cheyenne, Atlanta $\rightarrow$ New York).
  2. Check git status, verify clean build (`npm run build` and `python manage.py test`).
  3. Ready for Loom recording!
