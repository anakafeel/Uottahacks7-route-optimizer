import React from 'react';
import type { TrafficUpdate } from '@/types/map';
import { useSolaceConnection } from './solace/SolaceConnection';
import { solaceClient } from '@/utils/solaceClient';

interface SolaceHandlerProps {
  onTrafficUpdate: (update: TrafficUpdate) => void;
  onRouteUpdate: (routeData: any) => void;
}

const SolaceHandler: React.FC<SolaceHandlerProps> = ({ onTrafficUpdate, onRouteUpdate }) => {
  const connectionStatus = useSolaceConnection({
    onConnect: () => {
      // Subscribe to traffic updates
      solaceClient.subscribe('traffic/updates', (message) => {
        try {
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