import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from '@/components/ui/use-toast';

interface MapProps {
  onRouteUpdate?: (route: any) => void;
}

const Map = ({ onRouteUpdate }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current) return;

    // Using a public token for demo purposes - replace with your own token in production
    mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbHJzOXh4NGkwMXprMmp0YjB2dDhqemF0In0.yy5u7yEKEJ0ey3YsH4Fs5w';
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-74.5, 40],
        zoom: 9
      });

      // Add navigation controls
      const nav = new mapboxgl.NavigationControl();
      map.current.addControl(nav, 'top-right');
      
      // Add geolocation control
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      map.current.addControl(geolocate, 'top-right');

      map.current.on('load', () => {
        toast({
          title: "Map loaded successfully",
          description: "Ready to start route optimization",
        });

        // If we need to update the route, pass only serializable data
        if (onRouteUpdate) {
          onRouteUpdate({
            status: 'loaded',
            center: [-74.5, 40],
            zoom: 9
          });
        }
      });

      map.current.on('error', (e) => {
        toast({
          title: "Map Error",
          description: e.error?.message || "An error occurred while loading the map",
          variant: "destructive",
        });
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Map Initialization Error",
        description: error instanceof Error ? error.message : "Failed to initialize map",
        variant: "destructive",
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-background/90 p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-foreground">Route Optimizer</h2>
        <p className="text-sm text-muted-foreground">Real-time traffic updates coming soon</p>
      </div>
    </div>
  );
};

export default Map;