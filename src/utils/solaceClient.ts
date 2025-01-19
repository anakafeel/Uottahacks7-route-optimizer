import { initializeSolaceFactory, createSessionProperties } from './solace/config';
import { ConnectionManager } from './solace/connectionManager';
import type { MessageCallback } from './solace/types';
import { supabase } from "@/integrations/supabase/client";

class SolaceClient {
  private static instance: SolaceClient;
  private connectionManager: ConnectionManager;

  private constructor() {
    initializeSolaceFactory();
    this.connectionManager = new ConnectionManager();
  }

  static getInstance(): SolaceClient {
    if (!SolaceClient.instance) {
      SolaceClient.instance = new SolaceClient();
    }
    return SolaceClient.instance;
  }

  async connect(): Promise<void> {
    try {
      const { data: config, error: configError } = await supabase.functions.invoke('get-solace-config');

      if (configError || !config) {
        console.error('Failed to get Solace configuration:', configError);
        throw new Error('Failed to get Solace configuration');
      }

      console.log('Retrieved Solace configuration');
      const sessionProperties = createSessionProperties(config);
      
      await this.connectionManager.setupSession(sessionProperties);
      await this.connectionManager.connect();
    } catch (error) {
      console.error('Error connecting to Solace:', error);
      throw error;
    }
  }

  subscribe(topic: string, callback: MessageCallback): void {
    this.connectionManager.subscribe(topic, callback);
  }

  async publish(topic: string, message: string): Promise<void> {
    await this.connectionManager.publish(topic, message);
  }

  isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  disconnect(): void {
    this.connectionManager.disconnect();
  }
}

export const solaceClient = SolaceClient.getInstance();