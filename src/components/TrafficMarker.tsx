import React from 'react';
import L from 'leaflet';
import type { TrafficUpdate } from '@/types/map';

interface TrafficMarkerProps {
  map: L.Map;
  update: TrafficUpdate;
}

const TrafficMarker: React.FC<TrafficMarkerProps> = ({ map, update }) => {
  React.useEffect(() => {
    const trafficIcon = L.divIcon({
      className: 'traffic-marker',
      html: `<div class="w-6 h-6 rounded-full bg-destructive/80 border-2 border-white flex items-center justify-center">
        <span class="text-xs text-white">!</span>
      </div>`,
      iconSize: [24, 24]
    });

    const marker = L.marker([update.location.lat, update.location.lng], {
      icon: trafficIcon
    })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold">${update.type}</h3>
          <p class="text-sm">${update.description}</p>
          <span class="text-xs text-destructive">Severity: ${update.severity}</span>
        </div>
      `)
      .addTo(map);

    // Remove marker after 5 minutes
    const timeout = setTimeout(() => {
      if (map && marker) {
        marker.remove();
      }
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      marker.remove();
    };
  }, [map, update]);

  return null;
};

export default TrafficMarker;