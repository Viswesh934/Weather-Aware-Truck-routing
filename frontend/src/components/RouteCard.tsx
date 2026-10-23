import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { RouteOption } from '../types/routing';
import { useTripStore } from '../store/useTripStore';

interface RouteCardProps {
  route: RouteOption;
}

export function RouteCard({ route }: RouteCardProps) {
  const { selectedRouteId, setSelectedRouteId } = useTripStore();
  const isSelected = selectedRouteId === route.id;

  const totalMiles = route.total_distance_miles;
  const lowPct = ((route.risk_summary.low_miles / totalMiles) * 100).toFixed(0);
  const modPct = ((route.risk_summary.moderate_miles / totalMiles) * 100).toFixed(0);
  const highPct = ((route.risk_summary.high_miles / totalMiles) * 100).toFixed(0);
  const severePct = ((route.risk_summary.severe_miles / totalMiles) * 100).toFixed(0);
  const noTravelPct = ((route.risk_summary.no_travel_miles / totalMiles) * 100).toFixed(0);

  return (
    <div
      onClick={() => setSelectedRouteId(route.id)}
      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-xs text-slate-900">{route.name}</span>
        </div>
        {route.is_recommended ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Recommended
          </span>
        ) : route.risk_summary.no_travel_miles > 0 ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-600" /> No Travel
          </span>
        ) : route.risk_summary.severe_miles > 0 ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" /> Severe
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Alternative
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 my-2">
        <div>
          Distance:{' '}
          <span className="font-mono font-medium text-slate-900">
            {route.total_distance_miles.toFixed(1)} mi
          </span>
        </div>
        <div>
          Est. Time:{' '}
          <span className="font-mono font-medium text-slate-900">
            {Math.floor(route.total_duration_minutes / 60)}h {route.total_duration_minutes % 60}m
          </span>
        </div>
      </div>

      {/* Segmented Risk Exposure Bar */}
      <div className="mt-2.5 pt-2 border-t border-slate-100">
        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
          <span>Risk Exposure</span>
          <span className="font-mono">Avg Score: {route.average_risk_score.toFixed(2)}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${lowPct}%` }} className="bg-emerald-500" title={`Low: ${lowPct}%`} />
          <div style={{ width: `${modPct}%` }} className="bg-blue-500" title={`Moderate: ${modPct}%`} />
          <div style={{ width: `${highPct}%` }} className="bg-amber-500" title={`High: ${highPct}%`} />
          <div style={{ width: `${severePct}%` }} className="bg-orange-500" title={`Severe: ${severePct}%`} />
          <div style={{ width: `${noTravelPct}%` }} className="bg-rose-500" title={`No Travel: ${noTravelPct}%`} />
        </div>
      </div>
    </div>
  );
}
