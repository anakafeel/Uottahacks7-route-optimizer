import { useRef, useEffect } from 'react';
import L from 'leaflet';
import type { Route } from '@/types/route';

interface RouteMarkers {
  start: L.Marker | null;
  end: L.Marker | null;
  line: L.Polyline | null;
}

export const useRouteLayer = (map: L.Map | null, route: Route | null) => {
  const markersRef = useRef<RouteMarkers>({
    start: null,
    end: null,
    line: null,
  });

  useEffect(() => {
    if (!map || !route) return;

    const timer = setTimeout(() => {
      // Cleanup existing markers and line
      if (markersRef.current.start) markersRef.current.start.remove();
      if (markersRef.current.end) markersRef.current.end.remove();
      if (markersRef.current.line) markersRef.current.line.remove();

      try {
        // Add markers
        markersRef.current.start = L.marker([route.start_lat, route.start_lng])
          .bindPopup('Start Point')
          .addTo(map);

        markersRef.current.end = L.marker([route.end_lat, route.end_lng])
          .bindPopup('End Point')
          .addTo(map);

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
      } catch (error) {
        console.error('Error adding route markers:', error);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (markersRef.current.start) markersRef.current.start.remove();
      if (markersRef.current.end) markersRef.current.end.remove();
      if (markersRef.current.line) markersRef.current.line.remove();
    };
  }, [map, route]);

  return markersRef.current;
};