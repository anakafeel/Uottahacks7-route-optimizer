import { supabase } from "@/integrations/supabase/client";
import { solaceClient } from '@/utils/solaceClient';
import type { MapLocation } from '@/types/map';
import L from 'leaflet';

export const calculateRoute = async (
  start: MapLocation, 
  end: MapLocation,
  map: L.Map,
  routeLine: L.Polyline | null,
  onSuccess: (data: any) => void,
  onError: (error: any) => void
) => {
  try {
    console.log('Calculating route:', { start, end });
    
    if (routeLine) {
      routeLine.remove();
    }

    const newRouteLine = L.polyline(
      [[start.lat, start.lng], [end.lat, end.lng]], 
      { color: '#3b82f6', weight: 3, opacity: 0.8 }
    ).addTo(map);
    
    const distance = map.distance([start.lat, start.lng], [end.lat, end.lng]) / 1000; // Convert to km
    const estimatedDuration = Math.round(distance * 3); // 3 minutes per km

    const { data: trafficData, error: trafficError } = await supabase
      .from('traffic_updates')
      .select('*')
      .limit(5);

    if (trafficError) throw trafficError;

    const { data, error } = await supabase.functions.invoke('optimize-route', {
      body: {
        route: {
          start_lat: start.lat,
          start_lng: start.lng,
          end_lat: end.lat,
          end_lng: end.lng,
          estimated_duration: estimatedDuration,
          distance: distance.toFixed(2),
          traffic_level: 'Medium'
        },
        trafficData: trafficData || []
      },
    });

    if (error) throw error;

    if (solaceClient.isConnected()) {
      const routeRequest = {
        start,
        end,
        timestamp: new Date().toISOString(),
        distance,
        duration: estimatedDuration
      };

      solaceClient.publish('route/request', JSON.stringify(routeRequest))
        .then(() => console.log('Published route request to Solace:', routeRequest))
        .catch(err => console.warn('Failed to publish to Solace:', err));
    }

    onSuccess({
      data,
      distance,
      duration: estimatedDuration,
      routeLine: newRouteLine
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    onError(error);
  }
};