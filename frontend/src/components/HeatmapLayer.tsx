import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useTripStore } from '../store/useTripStore';

export function HeatmapLayer() {
  const map = useMap();
  const { routesData, forecastHour } = useTripStore();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!routesData || !routesData.corridor_heat_frames) return;

    const currentPoints = routesData.corridor_heat_frames[forecastHour] || [];

    if (!heatLayerRef.current) {
      // @ts-ignore - Leaflet.heat extends L
      heatLayerRef.current = L.heatLayer(currentPoints, {
        radius: 45,
        blur: 28,
        maxZoom: 12,
        max: 1.0,
        minOpacity: 0.45,
        gradient: {
          0.2: '#22c55e', // Green (Calm/Low)
          0.4: '#3b82f6', // Blue (Moderate)
          0.6: '#f59e0b', // Amber (High)
          0.8: '#f97316', // Orange (Severe)
          1.0: '#ef4444', // Red (No Travel)
        },
      }).addTo(map);
    } else {
      heatLayerRef.current.setLatLngs(currentPoints);
    }

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, routesData, forecastHour]);

  return null;
}
