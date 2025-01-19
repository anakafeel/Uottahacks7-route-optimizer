import React, { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from '@/hooks/use-toast';

interface MapProps {
  onRouteUpdate?: (route: any) => void;
}

const Map = ({ onRouteUpdate }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const hasShownError = useRef(false);

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

  useEffect(() => {
    // Prevent multiple initializations
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

      // Add navigation controls
      mapInstance.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );
      
      // Add geolocation control
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

      // Add event listeners
      mapInstance.once('load', handleMapLoad);

      // Only show error toast once
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

      // Cleanup function
      return () => {
        if (mapInstance) {
          mapInstance.remove();
          map.current = null;
          hasShownError.current = false;
        }
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
        <p className="text-sm text-muted-foreground">Real-time traffic updates coming soon</p>
      </div>
    </div>
  );
};

export default Map;