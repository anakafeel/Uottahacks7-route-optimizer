import L from 'leaflet';
import { useEffect, useRef } from 'react';
import type { Route } from '@/types/route';

interface RouteLayerProps {
  map: L.Map;
  route: Route;
}

const RouteLayer = ({ map, route }: RouteLayerProps) => {
  const markersRef = useRef<{
    start?: L.Marker;
    end?: L.Marker;
    line?: L.Polyline;
  }>({});

  useEffect(() => {
    // Wait for next tick to ensure map is ready
    const timer = setTimeout(() => {
      if (!map) return;

      // Clean up existing markers and line
      if (markersRef.current.start) markersRef.current.start.remove();
      if (markersRef.current.end) markersRef.current.end.remove();
      if (markersRef.current.line) markersRef.current.line.remove();

      // Add markers
      markersRef.current.start = L.marker([route.start_lat, route.start_lng])
        .addTo(map)
        .bindPopup('Start Point');

      markersRef.current.end = L.marker([route.end_lat, route.end_lng])
        .addTo(map)
        .bindPopup('End Point');

      // Draw route line
      markersRef.current.line = L.polyline(
        [[route.start_lat, route.start_lng], [route.end_lat, route.end_lng]],
        { color: 'blue', weight: 3 }
      ).addTo(map);

      // Fit bounds to show the entire route
      const bounds = L.latLngBounds([
        [route.start_lat, route.start_lng],
        [route.end_lat, route.end_lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }, 0);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (markersRef.current.start) markersRef.current.start.remove();
      if (markersRef.current.end) markersRef.current.end.remove();
      if (markersRef.current.line) markersRef.current.line.remove();
    };
  }, [map, route]);

  return null;
};

export default RouteLayer;