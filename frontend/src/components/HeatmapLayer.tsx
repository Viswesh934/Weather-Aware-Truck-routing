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
        radius: 35,
        blur: 25,
        maxZoom: 10,
        max: 1.0,
        minOpacity: 0.35,
        gradient: {
          0.2: '#22c55e',
          0.4: '#3b82f6',
          0.6: '#f59e0b',
          0.8: '#f97316',
          1.0: '#ef4444',
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
