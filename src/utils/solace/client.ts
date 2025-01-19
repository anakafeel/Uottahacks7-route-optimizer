import * as solaceModule from 'solclientjs';
import { supabase } from "@/integrations/supabase/client";
import { initializeSolaceFactory, sessionProperties } from './config';
import { ConnectionManager } from './connectionManager';
import type { MessageCallback } from './types';

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
    if (this.connectionManager.isConnected()) {
      console.log('Already connected to Solace');
      return;
    }

    console.log('Initiating Solace connection...');

    try {
      const { data: config, error: configError } = await supabase.functions.invoke('get-solace-config');

      if (configError || !config) {
        throw new Error('Failed to get Solace configuration');
      }

      console.log('Retrieved Solace configuration successfully');

      const properties = sessionProperties({
        url: config.SOLACE_HOST_URL,
        vpnName: config.SOLACE_VPN_NAME,
        userName: config.SOLACE_USERNAME,
        password: config.SOLACE_PASSWORD
      });

      await this.connectionManager.setupSession(properties);
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