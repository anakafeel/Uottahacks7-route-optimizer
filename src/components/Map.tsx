import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { solaceClient } from '@/utils/solaceClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

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
          // Handle route updates (e.g., display new routes, update existing ones)
        });

        // Publish current map bounds to help other components
        if (map.current) {
          const bounds = map.current.getBounds();
          solaceClient.publish('map/bounds', JSON.stringify({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          }));
        }

        toast({
          title: "Connected to Solace",
          description: "Real-time traffic updates enabled",
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

    // Create a traffic incident icon
    const trafficIcon = L.divIcon({
      className: 'traffic-marker',
      html: `<div class="w-6 h-6 rounded-full bg-destructive/80 border-2 border-white flex items-center justify-center">
        <span class="text-xs text-white">!</span>
      </div>`,
      iconSize: [24, 24]
    });

    // Add new traffic marker
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

    // Remove old markers after 5 minutes
    setTimeout(() => {
      if (map.current && marker) {
        marker.remove();
        trafficMarkers.current = trafficMarkers.current.filter(m => m !== marker);
      }
    }, 5 * 60 * 1000);
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

    // Only trigger route update once on initial load
    if (onRouteUpdate && map.current) {
      const center = map.current.getCenter();
      const bounds = map.current.getBounds();
      
      onRouteUpdate({
        status: 'loaded',
        centerLng: center.lng,
        centerLat: center.lat,
        zoom: map.current.getZoom(),
        bounds: {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth()
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        initialized.current = false;
      }
    };
  }, [onRouteUpdate]);

  // Subscribe to real-time driver updates
  useEffect(() => {
    const channel = supabase
      .channel('drivers-location')
      .on<DriverUpdate>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers'
        },
        (payload) => {
          if (!map.current) return;

          const driver = payload.new as DriverUpdate;
          
          if (!driver || !driver.id || typeof driver.current_lat !== 'number' || typeof driver.current_lng !== 'number') {
            console.warn('Invalid driver data received:', driver);
            return;
          }

          if (markers.current[driver.id]) {
            markers.current[driver.id].setLatLng([driver.current_lat, driver.current_lng]);
          } else {
            const driverIcon = L.divIcon({
              className: 'driver-marker',
              html: `<div class="w-5 h-5 rounded-full bg-secondary border-2 border-white flex items-center justify-center">
                <span class="text-xs text-white">D</span>
              </div>`,
              iconSize: [20, 20]
            });

            markers.current[driver.id] = L.marker([driver.current_lat, driver.current_lng], {
              icon: driverIcon
            }).addTo(map.current);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" style={{ zIndex: 0 }} />
      <div className="absolute top-4 left-4 z-[1000] bg-background/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-border">
        <h2 className="text-lg font-bold text-foreground">Route Optimizer</h2>
        <p className="text-sm text-muted-foreground">Ottawa Region</p>
      </div>
    </div>
  );
};

export default Map;