import React from 'react';
import { useMapInstance } from '@/hooks/useMapInstance';
import type { Route } from '@/types/route';

interface MapProps {
  onRouteUpdate?: (route: Route | null) => void;
}

const Map: React.FC<MapProps> = ({ onRouteUpdate }) => {
  const mapInstance = useMapInstance('map-container');

  return (
    <div className="absolute inset-0">
      <div id="map-container" className="h-full" />
    </div>
  );
};

export default Map;