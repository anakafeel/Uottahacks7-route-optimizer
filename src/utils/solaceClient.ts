import * as solace from 'solclientjs';
import { supabase } from "@/integrations/supabase/client";
import { initializeSolaceFactory, sessionProperties } from './solace/config';

class SolaceClient {
  private session: solace.Session | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private subscriptions: Map<string, (message: solace.Message) => void> = new Map();

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
        console.error('Failed to get Solace configuration:', configError);
        throw new Error('Failed to get Solace configuration');
      }

      console.log('Retrieved Solace configuration:', {
        url: config.SOLACE_HOST_URL,
        vpnName: config.SOLACE_VPN_NAME,
        hasUsername: !!config.SOLACE_USERNAME,
        hasPassword: !!config.SOLACE_PASSWORD
      });

      const properties = sessionProperties({
        url: config.SOLACE_HOST_URL,
        vpnName: config.SOLACE_VPN_NAME,
        userName: config.SOLACE_USERNAME,
        password: config.SOLACE_PASSWORD
      });

      console.log('Creating Solace session with properties:', {
        url: properties.url,
        vpnName: properties.vpnName,
        hasUsername: !!properties.userName,
        connectTimeout: properties.connectTimeoutInMsecs
      });

      this.session = solace.SolclientFactory.createSession(properties);

      await new Promise<void>((resolve, reject) => {
        if (!this.session) {
          reject(new Error('Failed to create Solace session'));
          return;
        }

        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, properties.connectTimeoutInMsecs);

        // Set up detailed event logging
        this.session.on(solace.SessionEventCode.UP_NOTICE, () => {
          clearTimeout(connectionTimeout);
          this.connected = true;
          this.connecting = false;
          console.log('Successfully connected to Solace');
          this.reapplySubscriptions();
          resolve();
        });

        this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent) => {
          clearTimeout(connectionTimeout);
          this.connected = false;
          this.connecting = false;
          console.error('Solace connection failed:', sessionEvent.toString());
          reject(new Error(`Connection failed: ${sessionEvent.toString()}`));
        });

        this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
          this.connected = false;
          this.connecting = false;
          console.log('Disconnected from Solace');
        });

        // Add more detailed event logging
        this.session.on(solace.SessionEventCode.CONNECTING_EVENT, () => {
          console.log('Connecting to Solace...');
        });

        this.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, (sessionEvent) => {
          console.error('Subscription error:', sessionEvent.toString());
        });

        try {
          console.log('Attempting to connect session...');
          this.session.connect();
        } catch (error) {
          clearTimeout(connectionTimeout);
          this.connecting = false;
          console.error('Error during connect():', error);
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
        const topicDestination = solace.SolclientFactory.createTopicDestination(topic);
        await this.session.subscribe(topicDestination, true, callback, 10000);
        console.log(`Resubscribed to topic: ${topic}`);
      } catch (error) {
        console.error(`Error resubscribing to topic ${topic}:`, error);
      }
    }
  }

  subscribe(topic: string, callback: (message: solace.Message) => void): void {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
      console.log(`Subscribing to topic: ${topic}`);
      const topicDestination = solace.SolclientFactory.createTopicDestination(topic);
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
      const msg = solace.SolclientFactory.createMessage();
      msg.setDestination(solace.SolclientFactory.createTopicDestination(topic));
      msg.setBinaryAttachment(message);
      msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
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