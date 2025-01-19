import { useEffect, useRef, useState } from 'react';
import { solaceClient } from '@/utils/solaceClient';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const maxRetries = useRef(3);
  const retryCount = useRef(0);
  const retryTimeout = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    const initSolace = async () => {
      if (connectionAttempted.current) return;
      connectionAttempted.current = true;
      setStatus('connecting');

      try {
        console.log('Initiating Solace connection...');
        const { data: config, error: configError } = await supabase.functions.invoke('get-solace-config');

        if (configError || !config) {
          console.error('Failed to get Solace configuration:', configError);
          throw new Error('Failed to get Solace configuration');
        }

        console.log('Retrieved Solace configuration:', {
          hostUrl: config.SOLACE_HOST_URL,
          vpnName: config.SOLACE_VPN_NAME,
          hasUsername: !!config.SOLACE_USERNAME,
          hasPassword: !!config.SOLACE_PASSWORD
        });

        console.log('Attempting to connect to Solace...');
        await solaceClient.connect();
        
        console.log('Successfully connected to Solace PubSub+');
        setStatus('connected');
        retryCount.current = 0;
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
        
        if (retryCount.current < maxRetries.current) {
          retryCount.current++;
          connectionAttempted.current = false;
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount.current), 5000);
          console.log(`Retrying connection in ${retryDelay}ms (${retryCount.current}/${maxRetries.current})...`);
          
          toast({
            title: "Connection Error",
            description: `Retrying connection (${retryCount.current}/${maxRetries.current})...`,
            duration: 3000,
          });
          
          retryTimeout.current = setTimeout(initSolace, retryDelay);
        } else {
          toast({
            title: "Connection Error",
            description: "Unable to establish real-time connection. Please refresh the page.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    };

    initSolace();

    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
      if (solaceClient.isConnected()) {
        solaceClient.disconnect();
        setStatus('disconnected');
        onDisconnect?.();
      }
    };
  }, [onConnect, onDisconnect, onError, toast]);

  return status;
};