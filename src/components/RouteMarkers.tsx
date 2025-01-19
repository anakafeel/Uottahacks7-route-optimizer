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
    const markerColor = location.type === 'start' ? 'green' : 'red';
    const markerLabel = location.type === 'start' ? 'S' : 'E';
    
    const icon = L.divIcon({
      className: '',
      html: `
        <div style="width: 24px; height: 24px; background-color: ${markerColor}; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          ${markerLabel}
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    return L.marker([location.lat, location.lng], { 
      icon, 
      draggable: true,
      autoPan: true
    });
  };

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const location: MapLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        type: !startMarker.current ? 'start' : !endMarker.current ? 'end' : 'start'
      };

      if (!startMarker.current) {
        startMarker.current = createMarker(location)
          .addTo(map)
          .on('dragend', handleMarkerDrag);
        
        toast({
          title: "Start Location Set",
          description: "Click anywhere to set destination",
          duration: 3000,
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
          duration: 3000,
        });
      } else {
        // Reset markers if both exist
        if (startMarker.current) startMarker.current.remove();
        if (endMarker.current) endMarker.current.remove();
        
        startMarker.current = createMarker(location)
          .addTo(map)
          .on('dragend', handleMarkerDrag);
        endMarker.current = null;
        
        toast({
          title: "Route Reset",
          description: "Click anywhere to set new destination",
          duration: 3000,
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

        toast({
          title: "Route Updated",
          description: "Recalculating optimal route...",
          duration: 3000,
        });
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