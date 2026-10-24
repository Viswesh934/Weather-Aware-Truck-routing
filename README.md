# WATR — Weather-Aware Truck Routing

**WATR** is a commercial fleet safety and dispatch platform designed to help truck drivers and fleet operators choose the safest highway routes by factoring in real-time weather forecasts, gross vehicle weight, and travel time.

Unlike consumer navigation apps that optimize solely for the shortest distance or travel duration, WATR evaluates **spatiotemporal atmospheric hazards**—such as high crosswinds, heavy rain, and blizzard conditions—at the exact estimated hour a truck arrives at each highway segment.

---

## The Problem WATR Solves

1. **Crosswind Rollover Physics**: Commercial tractor-trailers have large surface areas that act like sails. A 45 mph crosswind that a passenger car easily handles can overturn a 35,000 lb trailer. WATR applies gross-vehicle-weight overrides to detect imminent rollover conditions.
2. **Dynamic Spatiotemporal Weather**: A long haul across states takes 14–20 hours. Checking the weather at departure time is useless for a checkpoint 500 miles away. WATR calculates cumulative transit time to query the atmospheric forecast at the truck's exact estimated time of arrival ($\text{ETA}$) at every checkpoint.
3. **Safety-First Route Optimization**: When comparing route alternatives, safety takes absolute priority over speed: a route with zero severe miles is preferred over a faster route that cuts through a blizzard or high-wind front.

---

## Architecture & System Design

WATR follows a decoupled, service-oriented architecture designed for low latency, high throughput, and seamless cloud deployment (AWS Lambda + Cloudflare).

```
                      [ User / Dispatcher Interface ]
                         React 18 + TypeScript + Vite
                       Tailwind CSS + Zustand + Leaflet
                                      │
                         REST API (HTTP / JSON / ETags)
                                      ▼
                       [ Django REST Framework API ]
                  LocMemCache + Conditional ETag Middleware
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
 [ AWS Location Service ]    [ Spatiotemporal Sampler ]    [ Open-Meteo Weather API ]
   • Places V2 (Geocode)       • Haversine Discretization    • Multi-point batching
   • Routes V2 (Calculate)     • 10 / 25 / 50 mi checkpoints • Hourly wind/rain/snow
   • Gross weight limits       • Arrival ETA interpolation   • Imperial units (mph, in)
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      ▼
                      [ Risk & Load Physics Engine ]
                        • Base weather thresholds
                        • Weight-adjusted wind limits
                        • Lexicographical Pareto ranker
                                      │
                                      ▼
                 [ Interactive Map & 48h Corridor Timeline ]
                   • Route polylines with risk coloring
                   • Animated moving truck position marker
                   • Hardware-accelerated canvas heatmap
```

---

## Core Capabilities

### 1. Multi-Route Commercial Truck Routing
* Integrates directly with **Amazon Location Service Routes V2** (`geo-routes`) using API Key authentication.
* Calculates 3 distinct commercial highway corridors using `TravelMode="Truck"`, accounting for vehicle gross weight, bridge ratings, and road geometry.
* Fallback geocoding and routing engine ensures uninterrupted operation across environments.

### 2. Spatiotemporal Checkpoint Sampling
* Discretizes highway coordinate geometries into uniform checkpoints spaced every **10, 25, or 50 miles**.
* Computes cumulative transit distances and arrival timestamps:
  $$\text{ETA}_k = T_{\text{departure}} + \left(\frac{D_k}{D_{\text{total}}}\right) \times \text{Duration}_{\text{total}}$$
* Checkpoint weather is queried specifically for hour $\text{ETA}_k$, guaranteeing accurate forecast alignment across multi-day hauls.

### 3. Atmospheric Risk & Load Physics Engine
Classifies weather conditions into 5 standardized safety tiers:

| Condition | Low (1) | Moderate (2) | High (3) | Severe (4) | No Travel (5) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Sustained Wind / Gust** | $< 25\text{ mph}$ | $25 - 34\text{ mph}$ | $35 - 44\text{ mph}$ | $45 - 54\text{ mph}$ | $\ge 55\text{ mph}$ |
| **Rainfall Rate** | $< 0.10\text{ in/hr}$ | $0.10 - 0.25$ | $0.25 - 0.50$ | $0.50 - 1.00$ | $> 1.00\text{ in/hr}$ |
| **Snowfall Rate** | $< 0.5\text{ in/hr}$ | $0.5 - 1.0$ | $1.0 - 2.0$ | $2.0 - 3.0$ | $> 3.0\text{ in/hr}$ |

#### Mandatory Gross Weight Overrides:
* **$\ge 55\text{ mph}$ wind**: $\rightarrow$ **No Travel** for *any* vehicle weight.
* **$45 - 54\text{ mph}$ wind AND weight $> 30,000\text{ lbs}$**: $\rightarrow$ Escalates to **No Travel** (Rollover Risk).
* **$35 - 44\text{ mph}$ wind AND weight $> 40,000\text{ lbs}$**: $\rightarrow$ Escalates to **Severe**.

### 4. Lexicographical Recommendation Engine
Routes are evaluated and sorted using a strict multi-criteria hierarchy:
1. **Fewest Severe & No Travel miles** (Safety first)
2. **Fewest High risk miles**
3. **Lowest average checkpoint risk score**
4. **Shortest total travel duration** (Efficiency tie-breaker)

The winning route is paired with plain-English dispatcher advice explaining the trade-off (e.g. *"Recommended: Completely avoids 45 miles of Severe crosswinds present on Route 2 with virtually no extra drive time"*).

### 5. Interactive 48-Hour Corridor Timeline & Moving Truck Simulator
* Features a 0–48 hour timeline slider that scrubs future weather fronts across the highway corridor.
* As the slider moves, an **animated truck icon (🚛)** glides along the interstate highway to show the vehicle's exact simulated location at that future hour.
* A live status strip displays current mile progress, drive time remaining, and weather conditions.
* Hardware-accelerated canvas heatmap (`leaflet.heat`) swaps pre-computed hourly frames in-memory at 60fps with zero network requests.

### 6. Caching & ETag Performance
* Server-side in-memory caching (`LocMemCache`) using deterministic SHA256 request hashing.
* Returns responses in **$< 10\text{ms}$** for repeated queries.
* Implements standard HTTP `ETag` and `Cache-Control: public, max-age=900` headers with conditional `304 Not Modified` support.

---

## Tech Stack

* **Backend**: Python 3.14, Django 6.1, Django REST Framework, `boto3`, `requests`, `python-dotenv`.
* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Leaflet, `react-leaflet`, `leaflet.heat`, `zustand`, `axios`.
* **Mapping**: Esri World Street Map (crisp city names, interstate highway shields, state borders).
* **APIs**:
  * **Amazon Location Service**: Routes V2 (`geo-routes`) and Places V2 (`geo-places`) via API Key authentication.
  * **Open-Meteo**: Batched hourly atmospheric forecasts (imperial units: mph, inches).

---

## Project Structure

```text
Weather-Aware-Truck-routing/
├── backend/
│   ├── api/
│   │   ├── rules/
│   │   │   └── risk_rules.json       # Declarative risk & load thresholds
│   │   ├── services/
│   │   │   ├── aws_location.py       # AWS Routes V2 & Places V2 client
│   │   │   ├── sampling.py           # Haversine discretization & ETA math
│   │   │   ├── open_meteo.py         # Batch weather query processor
│   │   │   ├── risk_engine.py        # Weather risk & load weight evaluator
│   │   │   ├── evaluation.py         # Route weather & risk pipeline orchestrator
│   │   │   ├── recommendation.py     # Lexicographical Pareto route ranker
│   │   │   └── corridor.py           # 48-hour heatmap corridor matrix
│   │   ├── tests/
│   │   │   ├── test_risk_engine.py   # Unit tests for risk rules & boundary physics
│   │   │   ├── test_sampling.py      # Unit tests for distance & ETA monotonicity
│   │   │   ├── test_evaluation.py    # Unit tests for mileage sums & overrides
│   │   │   └── test_recommendation.py# Unit tests for recommendation hierarchy
│   │   ├── views.py                  # /api/health/ and /api/routes/evaluate/
│   │   └── urls.py
│   ├── config/                       # Django settings, CORS, and caching
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── api/                      # Axios client & typed endpoints
│   │   ├── components/               # Modular Tailwind components
│   │   │   ├── Header.tsx            # Clean branding header
│   │   │   ├── DispatchForm.tsx      # Origin, destination, weight, interval
│   │   │   ├── RouteCard.tsx         # Route comparison cards & risk breakdown
│   │   │   ├── ForecastSlider.tsx    # 0-48h timeline scrubber & live truck status
│   │   │   ├── MapViewport.tsx       # Leaflet map with auto-fitting bounds
│   │   │   ├── RouteLayer.tsx        # Risk-colored polylines & checkpoint HUDs
│   │   │   └── HeatmapLayer.tsx      # 60fps canvas heatmap layer
│   │   ├── store/
│   │   │   └── useTripStore.ts       # Centralized Zustand state
│   │   ├── types/
│   │   │   └── routing.ts            # Strict TypeScript models
│   │   └── utils/
│   │       └── riskRules.ts          # Styling, colors, and badge metadata
│   ├── vite.config.ts
│   └── package.json
│
└── docs/
    └── third_party_apis.md           # AWS & Open-Meteo REST specifications
```

---

## Local Setup & Quickstart

### Prerequisites
* Python 3.11+
* Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env with your AWS Location Service API Key
cp .env.example .env
# Edit .env and paste:
# AWS_LOCATION_API_KEY=v1.public.your_api_key_here
# AWS_REGION=ap-south-1

python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. All `/api/*` network requests automatically proxy to the Django backend.

---

## Automated Test Suite

Run the complete backend test suite covering all risk rules, boundary conditions, Haversine sampling, and recommendation logic:

```bash
cd backend
source venv/bin/activate
python -m unittest discover -s api/tests
```

```text
...................
----------------------------------------------------------------------
Ran 19 tests in 0.003s

OK
```
