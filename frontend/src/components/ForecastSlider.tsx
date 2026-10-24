import { useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Navigation, Compass } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';

export function ForecastSlider() {
  const {
    routesData,
    selectedRouteId,
    forecastHour,
    setForecastHour,
    isPlayingForecast,
    togglePlayForecast,
    resetForecastHour,
  } = useTripStore();

  const isEnabled = Boolean(routesData && routesData.routes.length > 0);
  const activeRoute = routesData?.routes.find((r) => r.id === selectedRouteId);

  // Play animation loop (0 to 47 hours)
  useEffect(() => {
    let timer: any;
    if (isPlayingForecast && isEnabled) {
      timer = setInterval(() => {
        setForecastHour(forecastHour >= 47 ? 0 : forecastHour + 1);
      }, 750);
    }
    return () => clearInterval(timer);
  }, [isPlayingForecast, forecastHour, isEnabled, setForecastHour]);

  // Compute live dispatch state at current forecastHour
  let progressText = 'At Starting Point';
  let progressPct = 0;
  let currentMile = 0;
  let remainingHours = 0;

  if (activeRoute) {
    const totalHours = activeRoute.total_duration_minutes / 60.0;
    if (forecastHour <= 0) {
      progressText = 'Ready to Depart (Mile 0)';
      progressPct = 0;
      currentMile = 0;
      remainingHours = totalHours;
    } else if (forecastHour >= totalHours) {
      progressText = `Arrived at Destination (Total: ${totalHours.toFixed(1)} hrs)`;
      progressPct = 100;
      currentMile = activeRoute.total_distance_miles;
      remainingHours = 0;
    } else {
      progressPct = Math.round((forecastHour / totalHours) * 100);
      currentMile = Math.round((forecastHour / totalHours) * activeRoute.total_distance_miles);
      remainingHours = Math.max(0, totalHours - forecastHour);
      progressText = `On the Road • Mile ${currentMile} of ${activeRoute.total_distance_miles.toFixed(0)} miles (${progressPct}% done)`;
    }
  }

  return (
    <div className={`bg-white border-b border-slate-200 px-6 py-2.5 flex flex-col justify-center shadow-xs transition-opacity ${
      isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
    }`}>
      {/* Top Slider Row */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={togglePlayForecast}
            disabled={!isEnabled}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white transition cursor-pointer"
            title={isPlayingForecast ? 'Pause Timeline' : 'Play Timeline'}
          >
            {isPlayingForecast ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetForecastHour}
            disabled={!isEnabled}
            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Reset to Departure Time"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Trip Timeline &amp; Hourly Weather Forecast
              {!isEnabled && <span className="text-[11px] text-slate-400 font-normal">(Search for a route above to activate)</span>}
            </span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
              +{forecastHour} Hours
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="47"
            step="1"
            disabled={!isEnabled}
            value={forecastHour}
            onChange={(e) => setForecastHour(Number(e.target.value))}
            className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>Departure</span>
            <span>+12 Hours</span>
            <span>+24 Hours</span>
            <span>+36 Hours</span>
            <span>+47 Hours</span>
          </div>
        </div>
      </div>

      {/* Bottom Live Dispatch Readout Row */}
      {isEnabled && activeRoute && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="flex items-center gap-1 font-semibold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              <Navigation className="w-3 h-3 text-blue-600" />
              {progressText}
            </span>
            {remainingHours > 0 && (
              <span className="text-[11px] text-slate-500">
                Drive Time Remaining: ~{remainingHours.toFixed(1)} hours
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-emerald-600" />
              Weather Radar: Showing conditions at +{forecastHour}h
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
