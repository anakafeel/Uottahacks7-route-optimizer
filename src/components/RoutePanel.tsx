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
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  const handleOptimizeRoute = async () => {
    try {
      setIsOptimizing(true);
      toast({
        title: "Optimizing Route",
        description: "Analyzing route using Groq AI...",
      });

      // Get current traffic data
      const { data: trafficData, error: trafficError } = await supabase
        .from('traffic_updates')
        .select('*')
        .limit(5);

      if (trafficError) throw trafficError;

      console.log('Sending optimization request with:', { currentRoute, trafficData });

      // Call the optimize-route Edge Function
      const { data, error } = await supabase.functions.invoke('optimize-route', {
        body: {
          route: currentRoute,
          trafficData,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Received optimization response:', data);

      if (!data?.recommendations) {
        throw new Error('Invalid response format from optimization service');
      }

      setOptimizationResults(data.recommendations);

      toast({
        title: "Route Optimized",
        description: "AI recommendations ready",
        duration: 3000,
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
          <span>Estimated Time: {currentRoute?.estimated_duration || 25} mins</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-secondary" />
          <span>Distance: {currentRoute?.distance || '12.5'} km</span>
        </div>

        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <span>Traffic Alert: {currentRoute?.traffic_level || 'Medium'}</span>
        </div>
      </div>

      <ScrollArea className="h-48 mt-4">
        <div className="space-y-2">
          <h4 className="font-medium">AI Recommendations</h4>
          {optimizationResults ? (
            <div className="space-y-3 text-sm">
              {optimizationResults.alternatives?.map((alt: any, index: number) => (
                <div key={index} className="p-2 bg-accent/10 rounded">
                  <p>{alt.description}</p>
                  <p className="text-xs text-muted-foreground">Est. Time: {alt.estimated_time} mins</p>
                </div>
              ))}
              {optimizationResults.delays && (
                <div className="p-2 bg-destructive/10 rounded">
                  <p>Expected Delay: {optimizationResults.delays.minutes} mins</p>
                  <p className="text-xs text-muted-foreground">Severity: {optimizationResults.delays.severity}</p>
                </div>
              )}
              {optimizationResults.weather_impact && (
                <p className="text-xs text-muted-foreground">{optimizationResults.weather_impact}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click optimize to get AI-powered recommendations
            </p>
          )}
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