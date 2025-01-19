import React, { useRef, useState } from 'react';
import Map from '@/components/Map';
import RoutePanel from '@/components/RoutePanel';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { toast } = useToast();
  const toastShown = useRef(false);
  const [currentRoute, setCurrentRoute] = useState(null);

  const handleRouteUpdate = (route: any) => {
    // Only show toast once on initial load
    if (!toastShown.current) {
      toastShown.current = true;
      toast({
        title: "Map Ready",
        description: "Route optimization available",
      });
    }
    setCurrentRoute(route);
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <Map onRouteUpdate={handleRouteUpdate} />
      <RoutePanel currentRoute={currentRoute} />
    </div>
  );
};

export default Index;