import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { solaceClient } from '@/utils/solaceClient';
import RouteMarkers from './RouteMarkers';
import TrafficMarker from './TrafficMarker';
import SolaceHandler from './SolaceHandler';
import type { MapLocation, TrafficUpdate, RouteOptimization } from '@/types/map';

interface MapProps {
  onRouteUpdate?: (route: RouteOptimization) => void;
}

const Map = ({ onRouteUpdate }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const initialized = useRef(false);
  const [trafficUpdates, setTrafficUpdates] = useState<TrafficUpdate[]>([]);
  const { toast } = useToast();

  const handleRouteSelection = async (start: MapLocation, end: MapLocation) => {
    try {
      console.log('Route selection:', { start, end });
      
      // Call the optimize-route Edge Function directly first
      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: {
          route: {
            start_lat: start.lat,
            start_lng: start.lng,
            end_lat: end.lat,
            end_lng: end.lng
          }
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      // Try to publish to Solace if available
      try {
        await solaceClient.publish('route/request', JSON.stringify({
          start,
          end,
          timestamp: new Date().toISOString()
        }));
      } catch (solaceError) {
        console.warn('Solace publish failed (non-critical):', solaceError);
        // Continue execution even if Solace fails
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
      console.error('Error requesting route:', error);
      toast({
        title: "Route Error",
        description: "Failed to calculate route. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || initialized.current) return;

    initialized.current = true;
    
    map.current = L.map(mapContainer.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([45.4215, -75.6972], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        initialized.current = false;
      }
    };
  }, []);

  const handleTrafficUpdate = (update: TrafficUpdate) => {
    setTrafficUpdates(prev => [...prev, update]);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" style={{ zIndex: 0 }} />
      {map.current && (
        <>
          <RouteMarkers 
            map={map.current} 
            onRouteUpdate={handleRouteSelection} 
          />
          <SolaceHandler
            onTrafficUpdate={handleTrafficUpdate}
            onRouteUpdate={console.log}
          />
          {trafficUpdates.map((update, index) => (
            <TrafficMarker
              key={index}
              map={map.current}
              update={update}
            />
          ))}
        </>
      )}
      <div className="absolute top-4 left-4 z-[1000] bg-background/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-border">
        <h2 className="text-lg font-bold text-foreground">Route Optimizer</h2>
        <p className="text-sm text-muted-foreground">Click anywhere to set start point (green), then end point (red)</p>
      </div>
    </div>
  );
};

export default Map;