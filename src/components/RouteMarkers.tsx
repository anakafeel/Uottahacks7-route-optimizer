import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { MapLocation, RouteOptimization } from '@/types/map';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { solaceClient } from '@/utils/solaceClient';

interface RouteMarkersProps {
  map: L.Map;
  onRouteUpdate?: (route: RouteOptimization) => void;
}

const RouteMarkers: React.FC<RouteMarkersProps> = ({ map, onRouteUpdate }) => {
  const startMarker = useRef<L.Marker | null>(null);
  const endMarker = useRef<L.Marker | null>(null);
  const { toast } = useToast();

  const calculateRoute = async (start: MapLocation, end: MapLocation) => {
    try {
      console.log('Calculating route:', { start, end });
      
      // Calculate actual distance using Leaflet
      const distance = map.distance([start.lat, start.lng], [end.lat, end.lng]);
      const distanceInKm = distance / 1000;
      const estimatedDuration = Math.round(distanceInKm * 3); // Rough estimate: 3 minutes per km

      // Get current traffic data
      const { data: trafficData, error: trafficError } = await supabase
        .from('traffic_updates')
        .select('*')
        .limit(5);

      if (trafficError) throw trafficError;

      // Call the optimize-route Edge Function with actual route data
      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: {
          route: {
            start_lat: start.lat,
            start_lng: start.lng,
            end_lat: end.lat,
            end_lng: end.lng,
            estimated_duration: estimatedDuration,
            distance: distanceInKm.toFixed(2),
            traffic_level: 'Medium'
          },
          trafficData: trafficData || []
        },
      });

      if (error) throw error;

      // Try to publish to Solace
      try {
        await solaceClient.publish('route/request', JSON.stringify({
          start,
          end,
          timestamp: new Date().toISOString()
        }));
      } catch (solaceError) {
        console.warn('Solace publish failed (non-critical):', solaceError);
      }

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
        description: "Optimization recommendations ready",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "Route Error",
        description: "Failed to calculate route. Please try again.",
        variant: "destructive",
      });
    }
  };

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
        
        calculateRoute(
          { lat: start.lat, lng: start.lng, type: 'start' },
          { lat: end.lat, lng: end.lng, type: 'end' }
        );
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
        
        calculateRoute(
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