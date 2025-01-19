import React from 'react';
import { useMapInstance } from '@/hooks/useMapInstance';
import type { Route } from '@/types/route';

interface MapProps {
  onRouteUpdate?: (route: Route | null) => void;
}

const Map: React.FC<MapProps> = ({ onRouteUpdate }) => {
  const mapInstance = useMapInstance('map-container');

  return (
    <div className="relative w-full h-screen bg-background">
      <div id="map-container" className="absolute inset-0" />
    </div>
  );
};

export default Map;