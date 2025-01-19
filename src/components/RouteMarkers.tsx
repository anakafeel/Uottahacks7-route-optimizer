import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { MapLocation, RouteOptimization } from '@/types/map';
import { useToast } from '@/hooks/use-toast';
import { createMarker } from './map/MarkerCreator';
import { calculateRoute } from './map/RouteCalculator';

interface RouteMarkersProps {
  map: L.Map;
  onRouteUpdate?: (route: RouteOptimization) => void;
}

const RouteMarkers: React.FC<RouteMarkersProps> = ({ map, onRouteUpdate }) => {
  const startMarker = useRef<L.Marker | null>(null);
  const endMarker = useRef<L.Marker | null>(null);
  const routeLine = useRef<L.Polyline | null>(null);
  const { toast } = useToast();

  const handleRouteCalculation = async (start: MapLocation, end: MapLocation) => {
    await calculateRoute(
      start,
      end,
      map,
      routeLine.current,
      ({ data, distance, duration, routeLine: newRouteLine }) => {
        routeLine.current = newRouteLine;
        if (onRouteUpdate) {
          onRouteUpdate({
            status: 'updated',
            start,
            end,
            optimization: data
          });
        }
        toast({
          title: "Route Calculated",
          description: `Distance: ${distance.toFixed(2)}km, Est. Duration: ${duration}min`,
          duration: 3000,
        });
      },
      (error) => {
        toast({
          title: "Route Error",
          description: "Failed to calculate route. Please try again.",
          variant: "destructive",
        });
      }
    );
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
        
        handleRouteCalculation(
          { lat: start.lat, lng: start.lng, type: 'start' },
          { lat: end.lat, lng: end.lng, type: 'end' }
        );
      } else {
        // Reset markers if both exist
        if (startMarker.current) startMarker.current.remove();
        if (endMarker.current) endMarker.current.remove();
        if (routeLine.current) routeLine.current.remove();
        
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
        
        handleRouteCalculation(
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
      if (routeLine.current) routeLine.current.remove();
    };
  }, [map, onRouteUpdate, toast]);

  return null;
};

export default RouteMarkers;