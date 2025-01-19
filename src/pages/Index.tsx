import React, { useRef } from 'react';
import Map from '@/components/Map';
import RoutePanel from '@/components/RoutePanel';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { toast } = useToast();
  const toastShown = useRef(false);

  const handleRouteUpdate = (route: any) => {
    // Only show toast once on initial load
    if (route.status === 'loaded' && !toastShown.current) {
      toastShown.current = true;
      toast({
        title: "Map Ready",
        description: "Route optimization available",
      });
    }
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <Map onRouteUpdate={handleRouteUpdate} />
      <RoutePanel />
    </div>
  );
};

export default Index;