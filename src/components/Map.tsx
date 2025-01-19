import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import RouteLayer from './map/RouteLayer';
import DriversLayer from './map/DriversLayer';
import type { Route } from '@/types/route';

interface MapProps {
  onRouteUpdate?: (route: Route) => void;
}

const Map = ({ onRouteUpdate }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const { toast } = useToast();

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Create map instance
    const initMap = () => {
      if (!mapContainer.current) return;
      
      map.current = L.map(mapContainer.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([45.4215, -75.6972], 13);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.current);

      // Only trigger route update once on initial load
      if (onRouteUpdate) {
        onRouteUpdate(mockRoute);
      }
    };

    // Ensure DOM is ready before initializing map
    requestAnimationFrame(initMap);

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onRouteUpdate]);

  return (
    <div className="relative w-full h-screen">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 z-0"
        style={{ width: '100%', height: '100%', background: '#f8f9fa' }} 
      />
      {map.current && (
        <>
          <RouteLayer map={map.current} route={mockRoute} />
          <DriversLayer map={map.current} />
        </>
      )}
      <div className="absolute top-4 left-4 z-[1000] bg-background/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-border">
        <h2 className="text-lg font-bold text-foreground">Route Optimizer</h2>
        <p className="text-sm text-muted-foreground">Ottawa Region</p>
      </div>
    </div>
  );
};

export default Map;