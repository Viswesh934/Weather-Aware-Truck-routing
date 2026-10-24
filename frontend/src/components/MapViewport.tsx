import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { RouteLayer } from './RouteLayer';
import { HeatmapLayer } from './HeatmapLayer';
import { useTripStore } from '../store/useTripStore';

function AutoFitBounds({ coordinates }: { coordinates?: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const latLngs = coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
      map.fitBounds(latLngs, { padding: [60, 60], maxZoom: 11 });
    }
  }, [coordinates, map]);

  return null;
}

export function MapViewport() {
  const { routesData, selectedRouteId } = useTripStore();

  return (
    <div className="flex-1 w-full h-full relative">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of US
        zoom={4}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {/* Esri World Street Map - Crisp city names, interstate highway numbers, clean contrast */}
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Sources: Esri, DeLorme, NAVTEQ, USGS"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />

        {/* Dynamic Auto-Fit Bounds when route loads */}
        {routesData?.routes.find((r) => r.id === selectedRouteId) && (
          <AutoFitBounds
            coordinates={routesData.routes.find((r) => r.id === selectedRouteId)?.geometry.coordinates}
          />
        )}

        {/* 0-48h Corridor Weather Heatmap Layer */}
        {routesData && <HeatmapLayer />}

        {/* Alternative & Selected Route Polylines + Checkpoint Pins */}
        {routesData?.routes.map((route) => (
          <RouteLayer key={route.id} route={route} isSelected={route.id === selectedRouteId} />
        ))}
      </MapContainer>
    </div>
  );
}
