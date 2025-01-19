import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { solaceClient } from '@/utils/solaceClient';
import type { TrafficUpdate } from '@/types/map';

interface SolaceHandlerProps {
  onTrafficUpdate: (update: TrafficUpdate) => void;
  onRouteUpdate: (routeData: any) => void;
}

const SolaceHandler: React.FC<SolaceHandlerProps> = ({ onTrafficUpdate, onRouteUpdate }) => {
  const { toast } = useToast();

  React.useEffect(() => {
    const initSolace = async () => {
      try {
        await solaceClient.connect();
        
        // Subscribe to traffic updates
        solaceClient.subscribe('traffic/updates', (message) => {
          const binaryAttachment = message.getBinaryAttachment();
          const messageStr = typeof binaryAttachment === 'string' 
            ? binaryAttachment 
            : new TextDecoder().decode(binaryAttachment);
          const trafficData = JSON.parse(messageStr) as TrafficUpdate;
          onTrafficUpdate(trafficData);
        });

        // Subscribe to route updates
        solaceClient.subscribe('routes/updates', (message) => {
          const binaryAttachment = message.getBinaryAttachment();
          const messageStr = typeof binaryAttachment === 'string' 
            ? binaryAttachment 
            : new TextDecoder().decode(binaryAttachment);
          const routeData = JSON.parse(messageStr);
          onRouteUpdate(routeData);
        });

        toast({
          title: "Connected to Solace",
          description: "Real-time updates enabled",
        });
      } catch (error) {
        console.error('Failed to connect to Solace:', error);
        toast({
          title: "Connection Error",
          description: "Failed to initialize real-time updates",
          variant: "destructive",
        });
      }
    };

    initSolace();

    return () => {
      solaceClient.disconnect();
    };
  }, [onTrafficUpdate, onRouteUpdate, toast]);

  return null;
};

export default SolaceHandler;