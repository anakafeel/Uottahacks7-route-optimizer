import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

interface MapProps {
  onRouteUpdate?: (route: any) => void;
}

type DriverUpdate = Database['public']['Tables']['drivers']['Row'];

const Map = ({ onRouteUpdate }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const { toast } = useToast();
  const markers = useRef<{ [key: string]: L.Marker }>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Center on Ottawa
      map.current = L.map(mapContainer.current).setView([45.4215, -75.6972], 13);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.current);

      toast({
        title: "Map loaded successfully",
        description: "Ready to start route optimization",
      });

      if (onRouteUpdate) {
        const center = map.current.getCenter();
        const bounds = map.current.getBounds();
        
        const routeData = {
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
        };
        
        onRouteUpdate(routeData);
      }

      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Map Initialization Error",
        description: error instanceof Error ? error.message : "Failed to initialize map",
        variant: "destructive",
      });
    }
  }, [onRouteUpdate, toast]);

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
          
          // Type guard to ensure required properties exist
          if (!driver || !driver.id || typeof driver.current_lat !== 'number' || typeof driver.current_lng !== 'number') {
            console.warn('Invalid driver data received:', driver);
            return;
          }

          // Update or create marker for driver
          if (markers.current[driver.id]) {
            markers.current[driver.id].setLatLng([driver.current_lat, driver.current_lng]);
          } else {
            // Create custom icon for driver marker
            const driverIcon = L.divIcon({
              className: 'driver-marker',
              html: `<div style="width: 20px; height: 20px; border-radius: 50%; background-color: #4CAF50; border: 2px solid white;"></div>`,
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
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-background/90 p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-foreground">Route Optimizer</h2>
        <p className="text-sm text-muted-foreground">Ottawa Region</p>
      </div>
    </div>
  );
};

export default Map;