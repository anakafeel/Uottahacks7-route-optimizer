import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { createLocationMarker, MapLocation, publishRouteRequest } from '@/utils/mapInteractions';
import { useToast } from '@/hooks/use-toast';

interface RouteMarkersProps {
  map: L.Map | null;
  onRouteUpdate: (start: MapLocation, end: MapLocation) => void;
}

const RouteMarkers: React.FC<RouteMarkersProps> = ({ map, onRouteUpdate }) => {
  const startMarker = useRef<L.Marker | null>(null);
  const endMarker = useRef<L.Marker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      const location: MapLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        type: !startMarker.current ? 'start' : 'end'
      };

      if (!startMarker.current) {
        startMarker.current = createLocationMarker(location, map)
          .addTo(map)
          .on('dragend', (e) => handleMarkerDrag(e, 'start'));
        
        toast({
          title: "Start Location Set",
          description: "Click anywhere to set destination",
        });
      } else if (!endMarker.current) {
        endMarker.current = createLocationMarker(location, map)
          .addTo(map)
          .on('dragend', (e) => handleMarkerDrag(e, 'end'));
        
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
      }
    };

    const handleMarkerDrag = (e: L.DragEndEvent, type: 'start' | 'end') => {
      const marker = e.target;
      const location = marker.getLatLng();
      
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
      if (startMarker.current) map.removeLayer(startMarker.current);
      if (endMarker.current) map.removeLayer(endMarker.current);
    };
  }, [map, onRouteUpdate, toast]);

  return null;
};

export default RouteMarkers;