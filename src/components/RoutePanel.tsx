import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Navigation, AlertTriangle } from 'lucide-react';

interface RoutePanelProps {
  currentRoute?: any;
  alternatives?: any[];
  onRouteSelect?: (route: any) => void;
}

const RoutePanel = ({ currentRoute, alternatives, onRouteSelect }: RoutePanelProps) => {
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
          {/* TODO: Implement alternative routes from Groq optimization */}
          <p className="text-sm text-muted-foreground">Alternative routes will appear here based on real-time traffic data</p>
        </div>
      </ScrollArea>

      <div className="mt-4">
        <Button 
          className="w-full"
          variant="secondary"
          onClick={() => {
            // TODO: Implement route feedback
            console.log('Route feedback submitted');
          }}
        >
          Submit Route Feedback
        </Button>
      </div>
    </Card>
  );
};

export default RoutePanel;