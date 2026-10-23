import { MapPin, Navigation, Calendar, Weight, Layers } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';

export function DispatchForm() {
  const { params, setParam, isLoading, evaluateRoutes } = useTripStore();

  return (
    <div className="p-5 space-y-4 bg-white border-b border-slate-200">
      {/* Origin & Destination */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Origin
          </label>
          <input
            type="text"
            value={params.origin}
            onChange={(e) => setParam('origin', e.target.value)}
            placeholder="City, State (e.g. Chicago, IL)"
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-rose-600" /> Destination
          </label>
          <input
            type="text"
            value={params.destination}
            onChange={(e) => setParam('destination', e.target.value)}
            placeholder="City, State (e.g. Denver, CO)"
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Departure Date/Time */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-600" /> Departure Date &amp; Time
        </label>
        <input
          type="datetime-local"
          value={params.departure_time}
          onChange={(e) => setParam('departure_time', e.target.value)}
          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
      </div>

      {/* Load Weight */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
            <Weight className="w-3.5 h-3.5 text-slate-700" /> Gross Load Weight
          </label>
          <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {params.load_weight_lbs.toLocaleString()} lbs
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="80000"
          step="1000"
          value={params.load_weight_lbs}
          onChange={(e) => setParam('load_weight_lbs', Number(e.target.value))}
          className="w-full accent-slate-900 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>0 (Empty)</span>
          <span className="font-medium text-amber-600">&gt;30k (Wind limit)</span>
          <span className="font-medium text-orange-600">&gt;40k (Severe limit)</span>
          <span>80k</span>
        </div>
      </div>

      {/* Sampling Interval */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-600" /> Checkpoint Sampling Interval
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {([10, 25, 50] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setParam('sampling_interval_miles', interval)}
              className={`py-1.5 text-xs font-medium rounded border transition ${
                params.sampling_interval_miles === interval
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {interval} miles
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={() => evaluateRoutes()}
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Analyzing Route Safety...</span>
          </>
        ) : (
          <span>Analyze 3 Route Options</span>
        )}
      </button>
    </div>
  );
}
