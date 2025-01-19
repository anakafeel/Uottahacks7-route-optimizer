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
    if (!mapContainer.current || map.current) return;

    // Using a public token for demo purposes - replace with your own token in production
    mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbHJzOXh4NGkwMXprMmp0YjB2dDhqemF0In0.yy5u7yEKEJ0ey3YsH4Fs5w';
    
    try {
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-74.5, 40],
        zoom: 9
      });

      map.current = mapInstance;

      // Add navigation controls
      const nav = new mapboxgl.NavigationControl();
      mapInstance.addControl(nav, 'top-right');
      
      // Add geolocation control
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      mapInstance.addControl(geolocate, 'top-right');

      const handleMapLoad = () => {
        toast({
          title: "Map loaded successfully",
          description: "Ready to start route optimization",
        });

        if (onRouteUpdate) {
          const center = mapInstance.getCenter();
          const bounds = mapInstance.getBounds();
          
          // Only pass serializable data
          onRouteUpdate({
            status: 'loaded',
            center: [center.lng, center.lat],
            zoom: mapInstance.getZoom(),
            bounds: [
              [bounds.getWest(), bounds.getSouth()],
              [bounds.getEast(), bounds.getNorth()]
            ]
          });
        }
      };

      const handleMapError = (e: any) => {
        const errorMessage = e.error ? String(e.error) : "An error occurred while loading the map";
        toast({
          title: "Map Error",
          description: errorMessage,
          variant: "destructive",
        });
      };

      // Add event listeners
      mapInstance.on('load', handleMapLoad);
      mapInstance.on('error', handleMapError);

      // Cleanup function
      return () => {
        mapInstance.off('load', handleMapLoad);
        mapInstance.off('error', handleMapError);
        mapInstance.remove();
        map.current = null;
      };

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Map Initialization Error",
        description: error instanceof Error ? error.message : "Failed to initialize map",
        variant: "destructive",
      });
    }
  }, [onRouteUpdate, toast]); // Include dependencies that are used in the effect

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