import React from 'react';
import Map from '@/components/Map';
import RoutePanel from '@/components/RoutePanel';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { toast } = useToast();

  const handleRouteUpdate = (route: any) => {
    // TODO: Implement Solace message handling
    console.log('Route updated:', route);
    
    toast({
      title: "Route Updated",
      description: "New route optimization available",
    });
  };

  return (
    <div className="relative w-full h-screen bg-background">
      <Map onRouteUpdate={handleRouteUpdate} />
      <RoutePanel />
    </div>
  );
};

export default Index;