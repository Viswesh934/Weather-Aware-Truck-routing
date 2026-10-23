import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';

export function ForecastSlider() {
  const {
    routesData,
    forecastHour,
    setForecastHour,
    isPlayingForecast,
    togglePlayForecast,
    resetForecastHour,
  } = useTripStore();

  const isEnabled = Boolean(routesData && routesData.routes.length > 0);

  return (
    <div className={`bg-white border-b border-slate-200 px-6 py-2.5 flex items-center space-x-4 shadow-xs ${
      isEnabled ? '' : 'opacity-50 pointer-events-none'
    }`}>
      <div className="flex items-center space-x-1.5">
        <button
          onClick={togglePlayForecast}
          disabled={!isEnabled}
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white transition cursor-pointer"
          title={isPlayingForecast ? 'Pause Forecast' : 'Play Forecast'}
        >
          {isPlayingForecast ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={resetForecastHour}
          disabled={!isEnabled}
          className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          title="Reset to Departure Hour (T+0)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Corridor Weather Forecast Horizon
            {!isEnabled && <span className="text-[11px] text-slate-400 font-normal">(Evaluate routes to activate)</span>}
          </span>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
            T + {forecastHour} hrs
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="48"
          step="1"
          disabled={!isEnabled}
          value={forecastHour}
          onChange={(e) => setForecastHour(Number(e.target.value))}
          className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>Departure (T+0h)</span>
          <span>T+12h</span>
          <span>T+24h</span>
          <span>T+36h</span>
          <span>T+48h</span>
        </div>
      </div>
    </div>
  );
}
