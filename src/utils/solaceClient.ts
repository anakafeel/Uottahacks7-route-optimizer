import * as solaceModule from 'solclientjs';
import { supabase } from "@/integrations/supabase/client";
import { initializeSolaceFactory, sessionProperties } from './solace/config';

class SolaceClient {
  private session: solaceModule.Session | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private subscriptions: Map<string, (message: solaceModule.Message) => void> = new Map();

  constructor() {
    initializeSolaceFactory();
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) {
      console.log('Already connected or connecting to Solace');
      return;
    }

    this.connecting = true;
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

      this.session = solaceModule.SolclientFactory.createSession(properties);

      await new Promise<void>((resolve, reject) => {
        if (!this.session) {
          reject(new Error('Failed to create Solace session'));
          return;
        }

        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, properties.connectTimeoutInMsecs);

        this.session.on(solaceModule.SessionEventCode.UP_NOTICE, () => {
          clearTimeout(connectionTimeout);
          this.connected = true;
          this.connecting = false;
          console.log('Successfully connected to Solace');
          this.reapplySubscriptions();
          resolve();
        });

        this.session.on(solaceModule.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent) => {
          clearTimeout(connectionTimeout);
          this.connected = false;
          this.connecting = false;
          console.error('Solace connection failed:', sessionEvent);
          reject(new Error('Connection failed'));
        });

        this.session.on(solaceModule.SessionEventCode.DISCONNECTED, () => {
          this.connected = false;
          this.connecting = false;
          console.log('Disconnected from Solace');
        });

        try {
          console.log('Attempting to connect session...');
          this.session.connect();
        } catch (error) {
          clearTimeout(connectionTimeout);
          this.connecting = false;
          reject(error);
        }
      });
    } catch (error) {
      this.connecting = false;
      console.error('Error connecting to Solace:', error);
      throw error;
    }
  }

  private async reapplySubscriptions() {
    if (!this.session || !this.connected) return;

    for (const [topic, callback] of this.subscriptions.entries()) {
      try {
        const topicDestination = solaceModule.SolclientFactory.createTopicDestination(topic);
        await this.session.subscribe(topicDestination, true, callback, 10000);
        console.log(`Resubscribed to topic: ${topic}`);
      } catch (error) {
        console.error(`Error resubscribing to topic ${topic}:`, error);
      }
    }
  }

  subscribe(topic: string, callback: (message: solaceModule.Message) => void): void {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
      console.log(`Subscribing to topic: ${topic}`);
      const topicDestination = solaceModule.SolclientFactory.createTopicDestination(topic);
      this.session.subscribe(topicDestination, true, callback, 10000);
      this.subscriptions.set(topic, callback);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  async publish(topic: string, message: string): Promise<void> {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
      console.log(`Publishing to topic: ${topic}`, message);
      const msg = solaceModule.SolclientFactory.createMessage();
      msg.setDestination(solaceModule.SolclientFactory.createTopicDestination(topic));
      msg.setBinaryAttachment(message);
      msg.setDeliveryMode(solaceModule.MessageDeliveryModeType.DIRECT);
      this.session.send(msg);
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.session) {
      this.session.disconnect();
      this.session = null;
      this.connected = false;
      this.connecting = false;
      this.subscriptions.clear();
    }
  }
}

export const solaceClient = new SolaceClient();
