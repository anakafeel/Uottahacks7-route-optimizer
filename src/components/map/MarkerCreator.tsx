import L from 'leaflet';
import type { MapLocation } from '@/types/map';

export const createMarker = (location: MapLocation) => {
  const markerColor = location.type === 'start' ? '#22c55e' : '#ef4444';
  const markerLabel = location.type === 'start' ? 'S' : 'E';
  
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 30px; 
        height: 30px; 
        background-color: ${markerColor}; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-weight: bold; 
        font-size: 14px;
      ">
        ${markerLabel}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  return L.marker([location.lat, location.lng], { 
    icon, 
    draggable: true,
    autoPan: true
  });
};