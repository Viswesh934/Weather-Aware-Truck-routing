import { Polyline, CircleMarker, Popup, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import { RouteOption, Checkpoint } from '../types/routing';
import { useTripStore } from '../store/useTripStore';

interface RouteLayerProps {
  route: RouteOption;
  isSelected: boolean;
}

// Custom DivIcon for the Simulated Moving Truck
function createTruckIcon() {
  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 28px; height: 28px; background-color: rgba(37, 99, 235, 0.35); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 26px; height: 26px; background-color: #0f172a; color: #ffffff; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); font-size: 13px; z-index: 10;">
          🚛
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function RouteLayer({ route, isSelected }: RouteLayerProps) {
  const { setSelectedRouteId, forecastHour } = useTripStore();

  const fullPositions: [number, number][] = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

  const originCoord = fullPositions[0];
  const destCoord = fullPositions[fullPositions.length - 1];

  // Calculate simulated truck position along the active route based on forecastHour
  let truckPosition: [number, number] | null = null;
  let truckMile = 0;
  let truckStatusText = '';

  if (isSelected && fullPositions.length > 0) {
    const totalDurationHours = route.total_duration_minutes / 60.0;

    if (forecastHour <= 0) {
      truckPosition = originCoord;
      truckMile = 0;
      truckStatusText = 'At Starting Point';
    } else if (forecastHour >= totalDurationHours) {
      truckPosition = destCoord;
      truckMile = route.total_distance_miles;
      truckStatusText = `Arrived at Destination (${totalDurationHours.toFixed(1)} hrs)`;
    } else {
      const progressFraction = Math.max(0.0, Math.min(1.0, forecastHour / totalDurationHours));
      const targetIndex = Math.min(
        fullPositions.length - 1,
        Math.floor(progressFraction * (fullPositions.length - 1))
      );
      truckPosition = fullPositions[targetIndex];
      truckMile = Math.round(progressFraction * route.total_distance_miles);
      truckStatusText = `Mile ${truckMile} of ${route.total_distance_miles.toFixed(0)} mi`;
    }
  }

  return (
    <>
      {/* If selected: render segment-colored polylines */}
      {isSelected ? (
        <>
          {/* Subtle dark casing under active line for sharp contrast */}
          <Polyline
            positions={fullPositions}
            pathOptions={{
              color: '#0f172a',
              weight: 7,
              opacity: 0.85,
            }}
          />

          {/* Individual risk-colored road segments */}
          {route.segments && route.segments.length > 0 ? (
            route.segments.map((seg, sIdx) => {
              const segPositions: [number, number][] = seg.coordinates.map(([lon, lat]) => [lat, lon]);
              return (
                <Polyline
                  key={`seg-${sIdx}`}
                  positions={segPositions}
                  pathOptions={{
                    color: seg.risk_color,
                    weight: 5,
                    opacity: 1.0,
                  }}
                />
              );
            })
          ) : (
            <Polyline
              positions={fullPositions}
              pathOptions={{
                color: '#2563eb',
                weight: 5,
                opacity: 0.95,
              }}
            />
          )}

          {/* Origin Marker */}
          {originCoord && (
            <CircleMarker
              center={originCoord}
              radius={8}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#16a34a',
                fillOpacity: 1.0,
                weight: 2.5,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]} className="font-semibold text-xs text-slate-800">
                Starting Point
              </Tooltip>
            </CircleMarker>
          )}

          {/* Destination Marker */}
          {destCoord && (
            <CircleMarker
              center={destCoord}
              radius={8}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#dc2626',
                fillOpacity: 1.0,
                weight: 2.5,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]} className="font-semibold text-xs text-slate-800">
                Destination
              </Tooltip>
            </CircleMarker>
          )}

          {/* Simulated Moving Truck Marker */}
          {truckPosition && (
            <Marker
              position={truckPosition}
              icon={createTruckIcon()}
              zIndexOffset={1000}
            >
              <Tooltip permanent direction="top" offset={[0, -16]} className="font-bold text-xs">
                🚛 Your Truck at +{forecastHour}h ({truckStatusText})
              </Tooltip>
            </Marker>
          )}
        </>
      ) : (
        /* Alternative unselected routes: muted dashed lines */
        <Polyline
          positions={fullPositions}
          pathOptions={{
            color: '#64748b',
            weight: 3.5,
            opacity: 0.45,
            dashArray: '6, 6',
          }}
          eventHandlers={{
            click: () => setSelectedRouteId(route.id),
          }}
        >
          <Tooltip sticky direction="center">
            {route.name} (Click to switch to this route)
          </Tooltip>
        </Polyline>
      )}

      {/* Checkpoint Markers (only rendered on selected route) */}
      {isSelected &&
        route.checkpoints.map((cp: Checkpoint) => (
          <CircleMarker
            key={cp.index}
            center={[cp.coordinates[1], cp.coordinates[0]]}
            radius={cp.risk.score >= 4 ? 6.5 : 4.5}
            pathOptions={{
              color: '#ffffff',
              fillColor: cp.risk.color,
              fillOpacity: 1.0,
              weight: 1.5,
            }}
          >
            <Popup className="clean-popup">
              <div className="p-2.5 text-xs space-y-2 min-w-[210px]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-900">
                    Mile Marker {cp.distance_from_origin_miles.toFixed(0)}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: cp.risk.color }}
                  >
                    {cp.risk.level === 'Low'
                      ? 'Clear Conditions'
                      : cp.risk.level === 'Moderate'
                      ? 'Caution'
                      : cp.risk.level === 'High'
                      ? 'Hazardous Weather'
                      : cp.risk.level === 'Severe'
                      ? 'Severe Danger'
                      : 'Do Not Drive'}
                  </span>
                </div>

                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Truck Arrival:</span>
                    <span className="font-semibold text-slate-900">{cp.eta_local_display}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wind Gusts:</span>
                    <span className="font-medium text-slate-900">{cp.weather.wind_speed_mph} mph</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rainfall:</span>
                    <span className="font-medium text-slate-900">
                      {cp.weather.rain_rate_in_hr > 0
                        ? `${cp.weather.rain_rate_in_hr} in/hr`
                        : 'Dry / None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Snow / Ice:</span>
                    <span className="font-medium text-slate-900">
                      {cp.weather.snow_rate_in_hr > 0
                        ? `${cp.weather.snow_rate_in_hr} in/hr`
                        : 'None'}
                    </span>
                  </div>
                </div>

                {cp.risk.load_override_applied && (
                  <div className="text-[10px] text-rose-700 font-medium bg-rose-50 p-2 rounded border border-rose-200 leading-tight">
                    ⚠️ {cp.risk.load_rule_description}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </>
  );
}
