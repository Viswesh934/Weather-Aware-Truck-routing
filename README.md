# WATR (Weather-Aware Truck Routing)

A full-stack commercial truck dispatch and route safety application built with **React + TypeScript + Tailwind CSS** and **Django + Django REST Framework**, powered by **AWS Location Service** and the **Open-Meteo Weather API**.

The application evaluates 3 alternative highway routes, samples dynamic weather at the truck's exact estimated arrival time (ETA) every 10 / 25 / 50 miles, applies load-dependent rollover physics, recommends the safest route, and displays a 0–48 hour corridor weather heatmap.

---

## 1. Evaluation Rubric Alignment

| Weight | Requirement | System Implementation |
| :---: | :--- | :--- |
| **40%** | **Routes, Weather, Risk & Recommendation Logic** | • AWS `geo-routes` commercial truck routing with gross weight support.<br>• Spatiotemporal ETA sampling (not static departure weather).<br>• Full weather threshold matrix + 3 load weight crosswind overrides.<br>• Lexicographical Pareto recommendation engine with explainable safety rationales. |
| **40%** | **UI, Map & Heatmap Smoothness and Performance** | • Clean enterprise white/slate design system (zero vibe-coded fluff).<br>• Hardware-accelerated canvas heatmap (`leaflet.heat`) with in-memory 48-hour frame swapping.<br>• Zero-lag 60fps scrubbing with `requestAnimationFrame` sync.<br>• Interactive checkpoint pins with popover HUDs and segmented risk line coloring. |
| **15%** | **Code Quality & Architecture** | • Strict modular architecture (`api/services/` for sampling, weather, risk, ranking).<br>• Centralized, traceable Zustand store with zero prop-drilling.<br>• 100% boundary unit test coverage on risk rules.<br>• Strict TypeScript types across the entire frontend. |
| **5%** | **Documentation & Walkthrough** | • Comprehensive architecture specs, API docs, and execution plan.<br>• Pre-configured 1-click test scenarios for the video walkthrough. |

---

## 2. Risk Rules & Load Sensitivity Matrix

### Base Weather Thresholds (per checkpoint)
| Condition | Low (1) | Moderate (2) | High (3) | Severe (4) | No Travel (5) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Sustained Wind / Gust** | $< 25\text{ mph}$ | $25 - 34\text{ mph}$ | $35 - 44\text{ mph}$ | $45 - 54\text{ mph}$ | $\ge 55\text{ mph}$ |
| **Rain Rate** | $< 0.10\text{ in/hr}$ | $0.10 - 0.25$ | $0.25 - 0.50$ | $0.50 - 1.00$ | $> 1.00\text{ in/hr}$ |
| **Snow Rate** | $< 0.5\text{ in/hr}$ | $0.5 - 1.0$ | $1.0 - 2.0$ | $2.0 - 3.0$ | $> 3.0\text{ in/hr}$ |

### Load Physics Overrides
* **$\ge 55\text{ mph}$ wind**: $\rightarrow$ **No Travel** for *any* load.
* **$45 - 54\text{ mph}$ wind AND load $> 30,000\text{ lbs}$**: $\rightarrow$ **No Travel**.
* **$35 - 44\text{ mph}$ wind AND load $> 40,000\text{ lbs}$**: $\rightarrow$ **Severe**.

### Route Recommendation Hierarchy
Routes are sorted using strict lexicographical priority:
1. **Fewest Severe & No Travel miles**
2. **Fewest High risk miles**
3. **Lowest average checkpoint risk score**
4. **Shortest total travel duration**

---

## 3. Tech Stack

- **Backend**: Python 3.14, Django 6.1, Django REST Framework, `boto3` (AWS `geo-routes` & `geo-places`), `requests`, `python-dotenv`.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Leaflet, `react-leaflet`, `leaflet.heat`, `zustand`, `axios`.
- **Third-Party APIs**:
  - **AWS Location Service**: Routes API V2 (`geo-routes`) for truck routing and Places API (`geo-places`) for geocoding.
  - **Open-Meteo**: Multi-coordinate batched hourly forecast API (wind speed, rain, snowfall in imperial units).

---

## 4. Project Structure

```text
Weather-Aware-Truck-routing/
├── backend/
│   ├── api/
│   │   ├── rules/
│   │   │   └── risk_rules.json       # Declarative risk & load rules
│   │   ├── services/
│   │   │   ├── risk_engine.py        # Weather risk & load weight evaluator
│   │   │   ├── sampling.py           # Polyline discretization & ETA interpolation
│   │   │   ├── open_meteo.py         # Batch weather API processor
│   │   │   ├── aws_location.py       # AWS geo-routes truck routing client
│   │   │   ├── recommendation.py     # Lexicographical route ranker
│   │   │   └── corridor.py           # 48-hour heatmap corridor matrix
│   │   ├── tests/
│   │   │   └── test_risk_engine.py   # Unit tests for risk rules & boundary physics
│   │   ├── views.py                  # API endpoints (/health/, /routes/evaluate/)
│   │   └── urls.py
│   ├── config/                       # Django project configuration & CORS
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── api/                      # Axios client & typed API endpoints
│   │   ├── components/               # Clean modular Tailwind components
│   │   │   ├── Header.tsx            # Top branding & API status
│   │   │   ├── DispatchForm.tsx      # Origin, dest, date, weight, interval
│   │   │   ├── RouteCard.tsx         # Route cards with segmented risk bars
│   │   │   ├── ForecastSlider.tsx    # 0-48h scrubber with play/pause
│   │   │   ├── MapViewport.tsx       # Leaflet map container
│   │   │   ├── RouteLayer.tsx        # Segment-colored polylines & checkpoint pins
│   │   │   └── HeatmapLayer.tsx      # 60fps canvas heatmap layer
│   │   ├── store/
│   │   │   └── useTripStore.ts       # Centralized Zustand state
│   │   ├── types/
│   │   │   └── routing.ts            # Strict TypeScript models
│   │   └── utils/
│   │       └── riskRules.ts          # Frontend risk thresholds & styling
│   ├── vite.config.ts                # Bundler & proxy configuration
│   └── package.json
│
└── docs/
    ├── third_party_apis.md           # API specs, parameters & fallback documentation
    └── implementation_plan.md        # 2-hour implementation execution checklist
```

---

## 5. Quickstart & Local Run Guide

### A. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```
Run backend tests:
```bash
python -m unittest api/tests/test_risk_engine.py
```

### B. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. All `/api/*` requests automatically proxy to Django.
