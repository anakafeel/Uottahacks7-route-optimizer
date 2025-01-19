import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { MapLocation } from '@/types/map';
import { useToast } from '@/hooks/use-toast';

interface RouteMarkersProps {
  map: L.Map;
  onRouteUpdate: (start: MapLocation, end: MapLocation) => void;
}

const RouteMarkers: React.FC<RouteMarkersProps> = ({ map, onRouteUpdate }) => {
  const startMarker = useRef<L.Marker | null>(null);
  const endMarker = useRef<L.Marker | null>(null);
  const { toast } = useToast();

  const createMarker = (location: MapLocation) => {
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

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const location: MapLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        type: !startMarker.current ? 'start' : !endMarker.current ? 'end' : 'start'
      };

      if (!startMarker.current) {
        if (endMarker.current) {
          endMarker.current.remove();
          endMarker.current = null;
        }
        startMarker.current = createMarker(location)
          .addTo(map)
          .on('dragend', handleMarkerDrag);
        
        toast({
          title: "Start Location Set",
          description: "Click anywhere to set destination",
        });
      } else if (!endMarker.current) {
        endMarker.current = createMarker(location)
          .addTo(map)
          .on('dragend', handleMarkerDrag);
        
        const start = startMarker.current.getLatLng();
        const end = endMarker.current.getLatLng();
        
        onRouteUpdate(
          { lat: start.lat, lng: start.lng, type: 'start' },
          { lat: end.lat, lng: end.lng, type: 'end' }
        );

        toast({
          title: "Route Set",
          description: "Calculating optimal route...",
        });
      } else {
        // Reset markers if both exist
        startMarker.current.remove();
        endMarker.current.remove();
        startMarker.current = createMarker(location)
          .addTo(map)
          .on('dragend', handleMarkerDrag);
        endMarker.current = null;
        
        toast({
          title: "Start Location Reset",
          description: "Click anywhere to set new destination",
        });
      }
    };

    const handleMarkerDrag = () => {
      if (startMarker.current && endMarker.current) {
        const start = startMarker.current.getLatLng();
        const end = endMarker.current.getLatLng();
        
        onRouteUpdate(
          { lat: start.lat, lng: start.lng, type: 'start' },
          { lat: end.lat, lng: end.lng, type: 'end' }
        );
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      if (startMarker.current) startMarker.current.remove();
      if (endMarker.current) endMarker.current.remove();
    };
  }, [map, onRouteUpdate, toast]);

  return null;
};

export default RouteMarkers;