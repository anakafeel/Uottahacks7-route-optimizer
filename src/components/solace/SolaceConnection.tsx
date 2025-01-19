import { useEffect, useRef, useState } from 'react';
import { solaceClient } from '@/utils/solaceClient';
import { useToast } from '@/hooks/use-toast';

interface SolaceConnectionProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useSolaceConnection = ({
  onConnect,
  onDisconnect,
  onError
}: SolaceConnectionProps) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const connectionAttempted = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const initSolace = async () => {
      if (connectionAttempted.current) return;
      connectionAttempted.current = true;
      setStatus('connecting');

      try {
        console.log('Initiating Solace connection...');
        await solaceClient.connect();
        
        console.log('Successfully connected to Solace PubSub+');
        setStatus('connected');
        onConnect?.();
        
        toast({
          title: "Connected to Solace",
          description: "Real-time updates enabled",
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to connect to Solace:', error);
        setStatus('disconnected');
        onError?.(error);
        
        toast({
          title: "Connection Error",
          description: "Unable to establish real-time connection. Retrying...",
          variant: "destructive",
          duration: 5000,
        });
        
        // Reset connection attempt flag to allow future reconnection attempts
        connectionAttempted.current = false;
      }
    };

    initSolace();

    return () => {
      if (solaceClient.isConnected()) {
/*         solaceClient.disconnect();
        setStatus('disconnected');
        onDisconnect?.(); */
      }
    };
  }, [onConnect, onDisconnect, onError, toast]);

  return status;
};