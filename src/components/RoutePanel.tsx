import React, { useState } from 'react';
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
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimizeRoute = async () => {
    try {
      setIsOptimizing(true);
      toast({
        title: "Optimizing Route",
        description: "Calculating best route using AI...",
      });

      // Get current traffic data
      const { data: trafficData, error: trafficError } = await supabase
        .from('traffic_updates')
        .select('*')
        .limit(5);

      if (trafficError) throw trafficError;

      // Call the optimize-route Edge Function
      const { data: optimizationData, error } = await supabase.functions.invoke('optimize-route', {
        body: {
          route: currentRoute,
          trafficData,
        },
      });

      if (error) throw error;

      // Update route with AI recommendations
      const { error: updateError } = await supabase
        .from('routes')
        .update({
          traffic_prediction: optimizationData.recommendations,
          status: 'optimized'
        })
        .eq('id', currentRoute?.id);

      if (updateError) throw updateError;

      toast({
        title: "Route Optimized",
        description: "New recommendations available",
      });
    } catch (error) {
      console.error('Error optimizing route:', error);
      toast({
        title: "Optimization Error",
        description: "Failed to optimize route. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <Card className="fixed right-4 top-20 w-80 bg-background/95 p-4 shadow-xl backdrop-blur-sm border border-border z-[1000]">
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
          <h4 className="font-medium">AI Recommendations</h4>
          <p className="text-sm text-muted-foreground">
            Route optimization powered by Groq AI
          </p>
        </div>
      </ScrollArea>

      <div className="mt-4">
        <Button 
          className="w-full"
          variant="secondary"
          onClick={handleOptimizeRoute}
          disabled={isOptimizing}
        >
          {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
        </Button>
      </div>
    </Card>
  );
};

export default RoutePanel;