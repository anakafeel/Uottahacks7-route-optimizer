import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { solaceClient } from '@/utils/solaceClient';
import RouteMarkers from './RouteMarkers';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { MapLocation } from '@/utils/mapInteractions';

interface MapProps {
  onRouteUpdate?: (route: any) => void;
}

type DriverUpdate = Database['public']['Tables']['drivers']['Row'];

interface TrafficUpdate {
  location: {
    lat: number;
    lng: number;
  };
  type: string;
  severity: string;
  description: string;
}

const Map = ({ onRouteUpdate }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const { toast } = useToast();
  const markers = useRef<{ [key: string]: L.Marker }>({});
  const trafficMarkers = useRef<L.Marker[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const initialized = useRef(false);

  const handleRouteSelection = async (start: MapLocation, end: MapLocation) => {
    try {
      await solaceClient.publish('route/request', JSON.stringify({
        start,
        end,
        timestamp: new Date().toISOString()
      }));

      // Call the optimize-route Edge Function
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

      if (error) throw error;

      console.log('Route optimization response:', data);
      
      if (onRouteUpdate) {
        onRouteUpdate({
          status: 'updated',
          start,
          end,
          optimization: data
        });
      }
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

  // Initialize Solace connection
  useEffect(() => {
    const initSolace = async () => {
      try {
        await solaceClient.connect();
        
        // Subscribe to traffic updates
        solaceClient.subscribe('traffic/updates', (message) => {
          const binaryAttachment = message.getBinaryAttachment();
          const messageStr = typeof binaryAttachment === 'string' 
            ? binaryAttachment 
            : new TextDecoder().decode(binaryAttachment);
          const trafficData = JSON.parse(messageStr) as TrafficUpdate;
          handleTrafficUpdate(trafficData);
        });

        // Subscribe to route updates
        solaceClient.subscribe('routes/updates', (message) => {
          const binaryAttachment = message.getBinaryAttachment();
          const messageStr = typeof binaryAttachment === 'string' 
            ? binaryAttachment 
            : new TextDecoder().decode(binaryAttachment);
          const routeData = JSON.parse(messageStr);
          console.log('Received route update:', routeData);
        });

        toast({
          title: "Connected to Solace",
          description: "Real-time updates enabled",
        });
      } catch (error) {
        console.error('Failed to connect to Solace:', error);
        toast({
          title: "Connection Error",
          description: "Failed to initialize real-time updates",
          variant: "destructive",
        });
      }
    };

    initSolace();

    return () => {
      solaceClient.disconnect();
    };
  }, [toast]);

  // Handle incoming traffic updates
  const handleTrafficUpdate = (update: TrafficUpdate) => {
    if (!map.current) return;

    const trafficIcon = L.divIcon({
      className: 'traffic-marker',
      html: `<div class="w-6 h-6 rounded-full bg-destructive/80 border-2 border-white flex items-center justify-center">
        <span class="text-xs text-white">!</span>
      </div>`,
      iconSize: [24, 24]
    });

    const marker = L.marker([update.location.lat, update.location.lng], {
      icon: trafficIcon
    })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold">${update.type}</h3>
          <p class="text-sm">${update.description}</p>
          <span class="text-xs text-destructive">Severity: ${update.severity}</span>
        </div>
      `)
      .addTo(map.current);

    trafficMarkers.current.push(marker);

    setTimeout(() => {
      if (map.current && marker) {
        marker.remove();
        trafficMarkers.current = trafficMarkers.current.filter(m => m !== marker);
      }
    }, 5 * 60 * 1000);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" style={{ zIndex: 0 }} />
      {map.current && (
        <RouteMarkers 
          map={map.current} 
          onRouteUpdate={handleRouteSelection} 
        />
      )}
      <div className="absolute top-4 left-4 z-[1000] bg-background/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-border">
        <h2 className="text-lg font-bold text-foreground">Route Optimizer</h2>
        <p className="text-sm text-muted-foreground">Click anywhere to set route points</p>
      </div>
    </div>
  );
};

export default Map;