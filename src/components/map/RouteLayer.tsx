import L from 'leaflet';
import { useEffect } from 'react';
import type { Route } from '@/types/route';

interface RouteLayerProps {
  map: L.Map;
  route: Route;
}

const RouteLayer = ({ map, route }: RouteLayerProps) => {
  useEffect(() => {
    if (!map) return;

    // Add markers
    const startMarker = L.marker([route.start_lat, route.start_lng])
      .addTo(map)
      .bindPopup('Start Point');

    const endMarker = L.marker([route.end_lat, route.end_lng])
      .addTo(map)
      .bindPopup('End Point');

    // Draw route line
    const routeLine = L.polyline(
      [[route.start_lat, route.start_lng], [route.end_lat, route.end_lng]],
      { color: 'blue', weight: 3 }
    ).addTo(map);

    // Fit bounds to show the entire route
    const bounds = L.latLngBounds([
      [route.start_lat, route.start_lng],
      [route.end_lat, route.end_lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Cleanup
    return () => {
      startMarker.remove();
      endMarker.remove();
      routeLine.remove();
    };
  }, [map, route]);

  return null;
};

export default RouteLayer;