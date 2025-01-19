import React, { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

interface MapProps {
  onRouteUpdate?: (route: any) => void;
}

const Map = ({ onRouteUpdate }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const hasShownError = useRef(false);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const handleMapLoad = useCallback(() => {
    if (!map.current) return;
    
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
  }, [onRouteUpdate, toast]);

  // Subscribe to real-time driver updates
  useEffect(() => {
    const channel = supabase
      .channel('drivers-location')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers'
        },
        (payload) => {
          if (!map.current) return;

          const { new: driver } = payload;
          if (driver.current_lat && driver.current_lng) {
            // Update or create marker for driver
            if (markers.current[driver.id]) {
              markers.current[driver.id].setLngLat([driver.current_lng, driver.current_lat]);
            } else {
              const el = document.createElement('div');
              el.className = 'driver-marker';
              el.style.width = '20px';
              el.style.height = '20px';
              el.style.borderRadius = '50%';
              el.style.backgroundColor = '#4CAF50';
              el.style.border = '2px solid white';

              markers.current[driver.id] = new mapboxgl.Marker(el)
                .setLngLat([driver.current_lng, driver.current_lat])
                .addTo(map.current);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbHJzOXh4NGkwMXprMmp0YjB2dDhqemF0In0.yy5u7yEKEJ0ey3YsH4Fs5w';
      
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-74.5, 40],
        zoom: 9
      });

      map.current = mapInstance;

      mapInstance.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );
      
      mapInstance.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

      mapInstance.once('load', handleMapLoad);

      mapInstance.on('error', (e: any) => {
        if (!hasShownError.current) {
          const errorMessage = e.error ? String(e.error) : "An error occurred while loading the map";
          toast({
            title: "Map Error",
            description: errorMessage,
            variant: "destructive",
          });
          hasShownError.current = true;
        }
      });

      return () => {
        Object.values(markers.current).forEach(marker => marker.remove());
        markers.current = {};
        mapInstance.remove();
        map.current = null;
        hasShownError.current = false;
      };

    } catch (error) {
      if (!hasShownError.current) {
        console.error('Error initializing map:', error);
        toast({
          title: "Map Initialization Error",
          description: error instanceof Error ? error.message : "Failed to initialize map",
          variant: "destructive",
        });
        hasShownError.current = true;
      }
    }
  }, [handleMapLoad, toast]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-background/90 p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-foreground">Route Optimizer</h2>
        <p className="text-sm text-muted-foreground">Real-time traffic updates active</p>
      </div>
    </div>
  );
};

export default Map;