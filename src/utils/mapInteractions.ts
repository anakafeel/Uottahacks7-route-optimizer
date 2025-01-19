import L from 'leaflet';
import { solaceClient } from './solaceClient';

export interface MapLocation {
  lat: number;
  lng: number;
  type: 'start' | 'end';
}

export const createLocationMarker = (location: MapLocation, map: L.Map) => {
  const markerColor = location.type === 'start' ? 'primary' : 'secondary';
  const markerLabel = location.type === 'start' ? 'S' : 'E';
  
  const icon = L.divIcon({
    className: `location-marker`,
    html: `<div class="w-6 h-6 rounded-full bg-${markerColor} border-2 border-white flex items-center justify-center">
      <span class="text-xs text-white">${markerLabel}</span>
    </div>`,
    iconSize: [24, 24]
  });

  return L.marker([location.lat, location.lng], { icon, draggable: true });
};

export const publishRouteRequest = async (start: MapLocation, end: MapLocation) => {
  try {
    await solaceClient.publish('route/request', JSON.stringify({
      start,
      end,
      timestamp: new Date().toISOString()
    }));
    
    console.log('Route request published successfully');
  } catch (error) {
    console.error('Error publishing route request:', error);
    throw error;
  }
};