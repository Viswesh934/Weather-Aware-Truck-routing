import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import { RouteOption, Checkpoint } from '../types/routing';
import { useTripStore } from '../store/useTripStore';

interface RouteLayerProps {
  route: RouteOption;
  isSelected: boolean;
}

export function RouteLayer({ route, isSelected }: RouteLayerProps) {
  const { setSelectedRouteId } = useTripStore();

  // Leaflet expects [latitude, longitude]
  const positions: [number, number][] = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

  return (
    <>
      {/* Route Polyline */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: isSelected ? '#0f172a' : '#94a3b8',
          weight: isSelected ? 5 : 3,
          opacity: isSelected ? 0.9 : 0.4,
          dashArray: isSelected ? undefined : '6, 6',
        }}
        eventHandlers={{
          click: () => setSelectedRouteId(route.id),
        }}
      />

      {/* Checkpoint Markers (only rendered on active route to prevent visual clutter) */}
      {isSelected &&
        route.checkpoints.map((cp: Checkpoint) => (
          <CircleMarker
            key={cp.index}
            center={[cp.coordinates[1], cp.coordinates[0]]}
            radius={cp.risk.score >= 4 ? 6 : 4}
            pathOptions={{
              color: '#ffffff',
              fillColor: cp.risk.color,
              fillOpacity: 0.9,
              weight: 1.5,
            }}
          >
            <Popup className="clean-popup">
              <div className="p-2 text-xs space-y-1.5 min-w-[180px]">
                <div className="flex justify-between items-center border-b pb-1">
                  <span className="font-semibold text-slate-900">Mile {cp.distance_from_origin_miles.toFixed(0)}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: cp.risk.color }}
                  >
                    {cp.risk.level}
                  </span>
                </div>
                <div className="text-slate-600">
                  <div>ETA: <span className="font-medium text-slate-900">{cp.eta_local_display}</span></div>
                  <div>Wind: <span className="font-medium text-slate-900">{cp.weather.wind_speed_mph} mph</span></div>
                  <div>Rain: <span className="font-medium text-slate-900">{cp.weather.rain_rate_in_hr} in/hr</span></div>
                  <div>Snow: <span className="font-medium text-slate-900">{cp.weather.snow_rate_in_hr} in/hr</span></div>
                </div>
                {cp.risk.load_override_applied && (
                  <div className="text-[10px] text-rose-600 font-medium bg-rose-50 p-1 rounded border border-rose-100">
                    {cp.risk.load_rule_description}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </>
  );
}
