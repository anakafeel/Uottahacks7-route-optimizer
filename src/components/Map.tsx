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
  const initialized = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || initialized.current) return;

    // Wait for DOM to be ready
    requestAnimationFrame(() => {
      if (!mapContainer.current) return;
      
      initialized.current = true;
      
      map.current = L.map(mapContainer.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([45.4215, -75.6972], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.current);

      // Mock route data for testing
      const mockRoute = {
        id: '123',
        start_lat: 45.4215,
        start_lng: -75.6972,
        end_lat: 45.4515,
        end_lng: -75.6872,
        traffic_level: 'medium',
        estimated_duration: 25,
        weather_conditions: 'clear'
      };

      // Draw the route on the map after it's initialized
      const startMarker = L.marker([mockRoute.start_lat, mockRoute.start_lng])
        .addTo(map.current)
        .bindPopup('Start Point');

      const endMarker = L.marker([mockRoute.end_lat, mockRoute.end_lng])
        .addTo(map.current)
        .bindPopup('End Point');

      const routeLine = L.polyline(
        [[mockRoute.start_lat, mockRoute.start_lng], [mockRoute.end_lat, mockRoute.end_lng]],
        { color: 'blue', weight: 3 }
      ).addTo(map.current);

      const bounds = L.latLngBounds([
        [mockRoute.start_lat, mockRoute.start_lng],
        [mockRoute.end_lat, mockRoute.end_lng]
      ]);
      map.current.fitBounds(bounds, { padding: [50, 50] });

      // Only trigger route update once on initial load
      if (onRouteUpdate) {
        onRouteUpdate(mockRoute);
      }
    });

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
      <div 
        ref={mapContainer} 
        className="absolute inset-0 z-0"
        style={{ 
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0' // Light background while map loads
        }} 
      />
      <div className="absolute top-4 left-4 z-[1000] bg-background/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-border">
        <h2 className="text-lg font-bold text-foreground">Route Optimizer</h2>
        <p className="text-sm text-muted-foreground">Ottawa Region</p>
      </div>
    </div>
  );
};

export default Map;