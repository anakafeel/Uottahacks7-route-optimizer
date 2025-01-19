import React, { useEffect, useState } from 'react';
import type { TrafficUpdate } from '@/types/map';
import { useToast } from '@/hooks/use-toast';
import { messaging } from '@/utils/solace/messaging';

interface SolaceHandlerProps {
  onTrafficUpdate: (update: TrafficUpdate) => void;
  onRouteUpdate: (routeData: any) => void;
}

const SolaceHandler: React.FC<SolaceHandlerProps> = ({ onTrafficUpdate, onRouteUpdate }) => {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  useEffect(() => {
    const initializeSolace = async () => {
      try {
        setConnectionStatus('connecting');
        await messaging.connectWithPromise();
        setConnectionStatus('connected');
        
        toast({
          title: "Connected to Solace",
          description: "Real-time updates enabled",
          duration: 3000,
        });

        // Subscribe to traffic updates
        await messaging.subscribe('traffic/updates');
        messaging.register((message) => {
          try {
            const trafficData = JSON.parse(message.payloadString) as TrafficUpdate;
            console.log('Received traffic update:', trafficData);
            onTrafficUpdate(trafficData);
          } catch (error) {
            console.error('Error processing traffic update:', error);
            toast({
              title: "Error",
              description: "Failed to process traffic update",
              variant: "destructive",
            });
          }
        });

        // Subscribe to route updates
        await messaging.subscribe('routes/updates');
        messaging.register((message) => {
          try {
            const routeData = JSON.parse(message.payloadString);
            console.log('Received route update:', routeData);
            onRouteUpdate(routeData);
          } catch (error) {
            console.error('Error processing route update:', error);
            toast({
              title: "Error",
              description: "Failed to process route update",
              variant: "destructive",
            });
          }
        });

      } catch (error) {
        console.error('Solace connection error:', error);
        setConnectionStatus('disconnected');
        toast({
          title: "Connection Error",
          description: `Failed to connect: ${(error as Error).message}`,
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    initializeSolace();

    return () => {
      if (messaging.isConnected()) {
        messaging.disconnect();
        setConnectionStatus('disconnected');
      }
    };
  }, [onTrafficUpdate, onRouteUpdate, toast]);

  return (
    <div className="fixed bottom-4 right-4 z-[1000] bg-background/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-border">
      <div className="flex items-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
        />
        <span className="text-sm text-foreground">
          {connectionStatus === 'connected' ? 'Connected to PubSub+' :
           connectionStatus === 'connecting' ? 'Connecting...' :
           'Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default SolaceHandler;