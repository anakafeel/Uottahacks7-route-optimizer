import React, { useEffect, useRef, useState } from 'react';
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
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  useEffect(() => {
    const initSolace = async () => {
      if (connectionAttempted.current) return;
      connectionAttempted.current = true;
      setConnectionStatus('connecting');

      try {
        console.log('Attempting to connect to Solace PubSub+...');
        await solaceClient.connect();
        console.log('Successfully connected to Solace PubSub+');
        setConnectionStatus('connected');
        retryCount.current = 0;
        
        // Subscribe to traffic updates with detailed logging
        solaceClient.subscribe('traffic/updates', (message) => {
          try {
            console.log('Received traffic update message:', message);
            const binaryAttachment = message.getBinaryAttachment();
            const messageStr = typeof binaryAttachment === 'string' 
              ? binaryAttachment 
              : new TextDecoder().decode(binaryAttachment);
            console.log('Decoded traffic update:', messageStr);
            const trafficData = JSON.parse(messageStr) as TrafficUpdate;
            onTrafficUpdate(trafficData);
          } catch (error) {
            console.error('Error processing traffic update:', error);
            toast({
              title: "Message Processing Error",
              description: "Failed to process traffic update message",
              variant: "destructive",
            });
          }
        });

        // Subscribe to route updates with detailed logging
        solaceClient.subscribe('routes/updates', (message) => {
          try {
            console.log('Received route update message:', message);
            const binaryAttachment = message.getBinaryAttachment();
            const messageStr = typeof binaryAttachment === 'string' 
              ? binaryAttachment 
              : new TextDecoder().decode(binaryAttachment);
            console.log('Decoded route update:', messageStr);
            const routeData = JSON.parse(messageStr);
            onRouteUpdate(routeData);
          } catch (error) {
            console.error('Error processing route update:', error);
            toast({
              title: "Message Processing Error",
              description: "Failed to process route update message",
              variant: "destructive",
            });
          }
        });

        toast({
          title: "Connected to Solace",
          description: "Real-time updates enabled",
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to connect to Solace:', error);
        setConnectionStatus('disconnected');
        
        if (retryCount.current < maxRetries.current) {
          retryCount.current++;
          connectionAttempted.current = false;
          console.log(`Retrying connection (${retryCount.current}/${maxRetries.current})...`);
          setTimeout(initSolace, 2000);
        } else {
          toast({
            title: "Connection Error",
            description: "Unable to establish real-time connection. Please check your connection settings.",
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
        setConnectionStatus('disconnected');
      }
    };
  }, [onTrafficUpdate, onRouteUpdate, toast]);

  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-background/90 p-4 rounded-lg shadow-lg backdrop-blur-sm border border-border">
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