import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { solaceClient } from '@/utils/solaceClient';
import type { TrafficUpdate } from '@/types/map';

interface SolaceHandlerProps {
  onTrafficUpdate: (update: TrafficUpdate) => void;
  onRouteUpdate: (routeData: any) => void;
}

const SolaceHandler: React.FC<SolaceHandlerProps> = ({ onTrafficUpdate, onRouteUpdate }) => {
  const { toast } = useToast();
  const connectionAttempted = useRef(false);
  const maxRetries = useRef(3);
  const retryCount = useRef(0);

  useEffect(() => {
    const initSolace = async () => {
      if (connectionAttempted.current) return;
      connectionAttempted.current = true;

      try {
        await solaceClient.connect();
        console.log('Connected to Solace PubSub+');
        retryCount.current = 0; // Reset retry count on successful connection
        
        // Subscribe to traffic updates
        solaceClient.subscribe('traffic/updates', (message) => {
          try {
            console.log('Received traffic update:', message);
            const binaryAttachment = message.getBinaryAttachment();
            const messageStr = typeof binaryAttachment === 'string' 
              ? binaryAttachment 
              : new TextDecoder().decode(binaryAttachment);
            const trafficData = JSON.parse(messageStr) as TrafficUpdate;
            onTrafficUpdate(trafficData);
          } catch (error) {
            console.error('Error processing traffic update:', error);
          }
        });

        // Subscribe to route updates
        solaceClient.subscribe('routes/updates', (message) => {
          try {
            console.log('Received route update:', message);
            const binaryAttachment = message.getBinaryAttachment();
            const messageStr = typeof binaryAttachment === 'string' 
              ? binaryAttachment 
              : new TextDecoder().decode(binaryAttachment);
            const routeData = JSON.parse(messageStr);
            onRouteUpdate(routeData);
          } catch (error) {
            console.error('Error processing route update:', error);
          }
        });

        toast({
          title: "Connected to Solace",
          description: "Real-time updates enabled",
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to connect to Solace:', error);
        
        if (retryCount.current < maxRetries.current) {
          retryCount.current++;
          connectionAttempted.current = false; // Allow retry
          console.log(`Retrying connection (${retryCount.current}/${maxRetries.current})...`);
          setTimeout(initSolace, 2000); // Retry after 2 seconds
        } else {
          toast({
            title: "Connection Error",
            description: "Unable to establish real-time connection. Some features may be limited.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    };

    initSolace();

    return () => {
      if (solaceClient.isConnected()) {
        console.log('Disconnecting from Solace PubSub+');
        solaceClient.disconnect();
      }
    };
  }, [onTrafficUpdate, onRouteUpdate, toast]);

  return null;
};

export default SolaceHandler;