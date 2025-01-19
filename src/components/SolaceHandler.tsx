import React, { useEffect } from 'react';
import type { TrafficUpdate } from '@/types/map';
import { useSolaceConnection } from './solace/SolaceConnection';
import { solaceClient } from '@/utils/solaceClient';
import { useToast } from '@/hooks/use-toast';

interface SolaceHandlerProps {
  onTrafficUpdate: (update: TrafficUpdate) => void;
  onRouteUpdate: (routeData: any) => void;
}

const SolaceHandler: React.FC<SolaceHandlerProps> = ({ onTrafficUpdate, onRouteUpdate }) => {
  const { toast } = useToast();
  const connectionStatus = useSolaceConnection({
    onConnect: () => {
      console.log('Setting up Solace subscriptions after successful connection...');
      toast({
        title: "Connected to Solace",
        description: "Real-time updates enabled",
        duration: 3000,
      });
      
      // Subscribe to traffic updates
      console.log('Subscribing to traffic/updates topic...');
      solaceClient.subscribe('traffic/updates', (message) => {
        try {
          const binaryAttachment = message.getBinaryAttachment();
          const messageStr = typeof binaryAttachment === 'string' 
            ? binaryAttachment 
            : new TextDecoder().decode(binaryAttachment);
          const trafficData = JSON.parse(messageStr) as TrafficUpdate;
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
      console.log('Subscribing to routes/updates topic...');
      solaceClient.subscribe('routes/updates', (message) => {
        try {
          const binaryAttachment = message.getBinaryAttachment();
          const messageStr = typeof binaryAttachment === 'string' 
            ? binaryAttachment 
            : new TextDecoder().decode(binaryAttachment);
          const routeData = JSON.parse(messageStr);
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
    },
    onDisconnect: () => {
      console.log('Solace disconnected - cleaning up subscriptions');
      toast({
        title: "Disconnected",
        description: "Lost connection to real-time updates",
        variant: "destructive",
      });
    },
    onError: (error) => {
      console.error('Solace connection error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to real-time updates",
        variant: "destructive",
      });
    }
  });

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