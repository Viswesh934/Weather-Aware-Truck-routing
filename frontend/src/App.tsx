import { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  Weight,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Navigation,
  Wind,
  CloudRain,
  Snowflake,
  Activity,
  Server
} from 'lucide-react';

interface BackendHealth {
  status: string;
  service: string;
  timestamp: string;
  version: string;
  features: {
    routing_provider: string;
    weather_provider: string;
    risk_engine: string;
    corridor_forecast: string;
  };
}

export default function App() {
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  // Form State
  const [origin, setOrigin] = useState('Chicago, IL');
  const [destination, setDestination] = useState('Denver, CO');
  const [departureTime, setDepartureTime] = useState(
    new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)
  );
  const [loadWeight, setLoadWeight] = useState<number>(35000);
  const [samplingInterval, setSamplingInterval] = useState<10 | 25 | 50>(25);

  // Forecast Scrubber State (0 - 48 hours)
  const [forecastHour, setForecastHour] = useState<number>(0);
  const [isPlayingForecast, setIsPlayingForecast] = useState<boolean>(false);
  const [activeRouteId, setActiveRouteId] = useState<number>(1);

  // Check Django health on mount
  useEffect(() => {
    fetch('/api/health/')
      .then((res) => {
        if (!res.ok) throw new Error('Backend responded with ' + res.status);
        return res.json();
      })
      .then((data: BackendHealth) => {
        setBackendHealth(data);
        setIsLoadingHealth(false);
      })
      .catch((err) => {
        console.error('Failed to connect to Django:', err);
        setIsLoadingHealth(false);
      });
  }, []);

  // Forecast slider play simulation
  useEffect(() => {
    let timer: any;
    if (isPlayingForecast) {
      timer = setInterval(() => {
        setForecastHour((prev) => (prev >= 48 ? 0 : prev + 1));
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isPlayingForecast]);

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500/20 border border-amber-500/40 p-2 rounded-lg text-amber-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              AeroHaul <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Weather-Aware Truck Routing</span>
            </h1>
          </div>
        </div>

        {/* Backend & Service Status Pills */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Django API:</span>
            {isLoadingHealth ? (
              <span className="text-amber-400 animate-pulse">Connecting...</span>
            ) : backendHealth ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Connected
              </span>
            ) : (
              <span className="text-rose-400 font-medium">Disconnected</span>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">AWS Location + Open-Meteo</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Panel / Sidebar */}
        <aside className="w-96 border-r border-slate-800 bg-slate-900/95 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-3">
              Trip Dispatch Parameters
            </h2>

            <div className="space-y-4 text-sm">
              {/* Origin */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Origin
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Chicago, IL"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-rose-400" /> Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Denver, CO"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Departure Time */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" /> Departure Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Load Weight */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Weight className="w-3.5 h-3.5 text-amber-400" /> Load Weight
                  </label>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {loadWeight.toLocaleString()} lbs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80000"
                  step="1000"
                  value={loadWeight}
                  onChange={(e) => setLoadWeight(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Empty (0)</span>
                  <span>30k (Wind Limit)</span>
                  <span>40k (Severe Limit)</span>
                  <span>80k (Max)</span>
                </div>
              </div>

              {/* Checkpoint Resolution */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> Weather Sampling Interval
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([10, 25, 50] as const).map((interval) => (
                    <button
                      key={interval}
                      onClick={() => setSamplingInterval(interval)}
                      className={`py-1.5 text-xs font-medium rounded-md border transition-all ${
                        samplingInterval === interval
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {interval} Miles
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculate Button */}
              <button
                type="button"
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>Evaluate 3 Routes & Weather</span>
              </button>
            </div>
          </div>

          {/* Route Comparison Cards */}
          <div className="p-4 flex-1">
            <h2 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-3">
              Route Options & Safety Assessment
            </h2>

            <div className="space-y-3">
              {/* Route 1 - Recommended */}
              <div
                onClick={() => setActiveRouteId(1)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeRouteId === 1
                    ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="font-semibold text-xs text-white">Route 1 (I-80 W)</span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Recommended
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-2">
                  <div>Distance: <span className="text-slate-200 font-medium">1,002 mi</span></div>
                  <div>Duration: <span className="text-slate-200 font-medium">15h 10m</span></div>
                </div>
                {/* Risk Distribution Breakdown */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Risk Profile:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">820m Low</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">182m Mod</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-500">0m Sev</span>
                  </div>
                </div>
              </div>

              {/* Route 2 - Alternative */}
              <div
                onClick={() => setActiveRouteId(2)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeRouteId === 2
                    ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span className="font-semibold text-xs text-white">Route 2 (I-70 W)</span>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> High Wind Risk
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-2">
                  <div>Distance: <span className="text-slate-200 font-medium">1,018 mi</span></div>
                  <div>Duration: <span className="text-slate-200 font-medium">14h 55m</span></div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Risk Profile:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">650m Low</span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">75m High</span>
                  </div>
                </div>
              </div>

              {/* Route 3 - Alternative */}
              <div
                onClick={() => setActiveRouteId(3)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeRouteId === 3
                    ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    <span className="font-semibold text-xs text-white">Route 3 (US-36 / I-76)</span>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Severe Snow
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-2">
                  <div>Distance: <span className="text-slate-200 font-medium">1,040 mi</span></div>
                  <div>Duration: <span className="text-slate-200 font-medium">16h 20m</span></div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Risk Profile:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-rose-900/40 text-rose-300">45m Severe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center / Right Viewport: Map & Temporal Controls */}
        <main className="flex-1 flex flex-col relative bg-slate-950">
          {/* Top Corridor Forecast Scrubber Overlay */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur z-10 flex items-center space-x-4">
            <button
              onClick={() => setIsPlayingForecast(!isPlayingForecast)}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
              title={isPlayingForecast ? 'Pause Scrub' : 'Play Forecast Scrub'}
            >
              {isPlayingForecast ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                setIsPlayingForecast(false);
                setForecastHour(0);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Reset to Departure Hour (T+0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" /> Corridor Weather Heatmap Forecast
                </span>
                <span className="text-blue-400 font-mono font-bold bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                  T + {forecastHour} Hours
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                step="1"
                value={forecastHour}
                onChange={(e) => setForecastHour(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Departure (T+0h)</span>
                <span>T+12h</span>
                <span>T+24h</span>
                <span>T+36h</span>
                <span>T+48h Max Horizon</span>
              </div>
            </div>
          </div>

          {/* Map Container Area */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
            {/* Visual placeholder showing planned map interface and legend */}
            <div className="text-center p-8 max-w-lg border border-slate-800/80 rounded-2xl bg-slate-900/40 backdrop-blur shadow-2xl">
              <div className="inline-flex p-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
                <Navigation className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Interactive Map & Spatial Weather Canvas</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Full map engine integrating Leaflet / AWS Location Service vectors, 3 dynamic route polylines, checkpoint markers with ETA-synchronized weather, and 0–48h corridor heatmap.
              </p>

              {/* Risk Legend */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Checkpoint Risk Level Classification
                </span>
                <div className="grid grid-cols-5 gap-1.5 text-[11px] font-medium">
                  <div className="p-1.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    Low
                    <div className="text-[9px] text-emerald-400/80 font-normal">&lt;25mph</div>
                  </div>
                  <div className="p-1.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300">
                    Moderate
                    <div className="text-[9px] text-blue-400/80 font-normal">25-34mph</div>
                  </div>
                  <div className="p-1.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    High
                    <div className="text-[9px] text-amber-400/80 font-normal">35-44mph</div>
                  </div>
                  <div className="p-1.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300">
                    Severe
                    <div className="text-[9px] text-orange-400/80 font-normal">45-54mph</div>
                  </div>
                  <div className="p-1.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300">
                    No Travel
                    <div className="text-[9px] text-rose-400/80 font-normal">&ge;55mph</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Weather Conditions Indicator Widget */}
            <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs shadow-xl backdrop-blur flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Wind className="w-4 h-4 text-sky-400" />
                <span>Wind Risk</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <CloudRain className="w-4 h-4 text-blue-400" />
                <span>Rain Risk</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Snowflake className="w-4 h-4 text-indigo-300" />
                <span>Snow / Ice</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
