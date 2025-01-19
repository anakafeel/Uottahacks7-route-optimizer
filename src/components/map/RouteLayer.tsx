import React from 'react';
import { useRouteLayer } from '@/hooks/useRouteLayer';
import type { Route } from '@/types/route';

interface RouteLayerProps {
  map: L.Map | null;
  route: Route | null;
}

const RouteLayer: React.FC<RouteLayerProps> = ({ map, route }) => {
  useRouteLayer(map, route);
  return null;
};

export default RouteLayer;