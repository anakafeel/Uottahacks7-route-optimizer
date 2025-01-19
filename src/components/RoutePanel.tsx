import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Navigation, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

interface RoutePanelProps {
  currentRoute?: any;
  alternatives?: any[];
  onRouteSelect?: (route: any) => void;
}

const RoutePanel = ({ currentRoute, alternatives, onRouteSelect }: RoutePanelProps) => {
  const { toast } = useToast();

  const handleOptimizeRoute = async () => {
    try {
      // Simulate route optimization (replace with actual Solace integration)
      toast({
        title: "Optimizing Route",
        description: "Calculating best route based on real-time traffic...",
      });

      // Example: Update driver location
      const { error } = await supabase
        .from('drivers')
        .update({
          current_lat: 40.7128,
          current_lng: -74.0060,
          status: 'active'
        })
        .eq('id', 'your-driver-id'); // Replace with actual driver ID

      if (error) throw error;

    } catch (error) {
      console.error('Error optimizing route:', error);
      toast({
        title: "Optimization Error",
        description: "Failed to optimize route. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="absolute right-4 top-20 w-80 bg-background/90 p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Route Details</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-accent" />
          <span>Estimated Time: 25 mins</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-secondary" />
          <span>Distance: 12.5 km</span>
        </div>

        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <span>Traffic Alert: Medium</span>
        </div>
      </div>

      <ScrollArea className="h-48 mt-4">
        <div className="space-y-2">
          <h4 className="font-medium">Alternative Routes</h4>
          <p className="text-sm text-muted-foreground">
            Alternative routes will be calculated based on real-time traffic data
          </p>
        </div>
      </ScrollArea>

      <div className="mt-4">
        <Button 
          className="w-full"
          variant="secondary"
          onClick={handleOptimizeRoute}
        >
          Optimize Route
        </Button>
      </div>
    </Card>
  );
};

export default RoutePanel;