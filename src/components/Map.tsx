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
    console.log('Received traffic update:', update);
    setTrafficUpdates(prev => [...prev, update]);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" style={{ zIndex: 0 }} />
      {map.current && (
        <>
          <RouteMarkers 
            map={map.current} 
            onRouteUpdate={onRouteUpdate} 
          />
          <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2">
          <SolaceHandler 
            onTrafficUpdate={handleTrafficUpdate}
            onRouteUpdate={console.log}
            />
            </div>
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