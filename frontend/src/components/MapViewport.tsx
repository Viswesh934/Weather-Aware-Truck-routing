import { MapContainer, TileLayer } from 'react-leaflet';
import { RouteLayer } from './RouteLayer';
import { HeatmapLayer } from './HeatmapLayer';
import { useTripStore } from '../store/useTripStore';

export function MapViewport() {
  const { routesData, selectedRouteId } = useTripStore();
  const activeRoute = routesData?.routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="flex-1 w-full h-full relative">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of contiguous US
        zoom={4}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* Esri World Light Gray Canvas - 100% free, high-performance, no tile policy errors */}
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* 0-48h Corridor Weather Heatmap Layer */}
        {routesData && <HeatmapLayer />}

        {/* Alternative & Selected Route Polylines + Checkpoint Pins */}
        {routesData?.routes.map((route) => (
          <RouteLayer key={route.id} route={route} isSelected={route.id === selectedRouteId} />
        ))}
      </MapContainer>

      {/* Floating Active Route Rationale Banner (only shown when a route is actually evaluated) */}
      {activeRoute && routesData?.recommendation_reason && (
        <div className="absolute top-4 left-4 z-1000 max-w-md bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-3 shadow-md text-xs">
          <div className="font-semibold text-slate-900 mb-0.5">{activeRoute.name}</div>
          <div className="text-slate-600 leading-relaxed">
            {routesData.recommendation_reason}
          </div>
        </div>
      )}
    </div>
  );
}
