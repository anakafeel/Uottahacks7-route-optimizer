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
    
    // Remove existing route line if present
    if (routeLine) {
      routeLine.remove();
    }

    // Draw new route line
    const newRouteLine = L.polyline(
      [[start.lat, start.lng], [end.lat, end.lng]], 
      { color: 'blue', weight: 3, opacity: 0.8 }
    ).addTo(map);
    
    // Calculate distance using Leaflet
    const distance = map.distance([start.lat, start.lng], [end.lat, end.lng]);
    const distanceInKm = distance / 1000;
    const estimatedDuration = Math.round(distanceInKm * 3); // Rough estimate: 3 minutes per km

    // Get current traffic data
    const { data: trafficData, error: trafficError } = await supabase
      .from('traffic_updates')
      .select('*')
      .limit(5);

    if (trafficError) throw trafficError;

    // Call optimize-route Edge Function
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

    // Publish to Solace
    if (solaceClient.isConnected()) {
      const routeRequest = {
        start,
        end,
        timestamp: new Date().toISOString(),
        distance: distanceInKm,
        duration: estimatedDuration
      };

      await solaceClient.publish('route/request', JSON.stringify(routeRequest));
      console.log('Published route request to Solace:', routeRequest);
    } else {
      console.warn('Solace client not connected - route request not published');
    }

    onSuccess({
      data,
      distance: distanceInKm,
      duration: estimatedDuration,
      routeLine: newRouteLine
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    onError(error);
  }
};