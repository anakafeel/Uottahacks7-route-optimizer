import * as solaceModule from 'solclientjs';
import { supabase } from "@/integrations/supabase/client";

const factoryProps = new solaceModule.SolclientFactoryProperties();
factoryProps.profile = solaceModule.SolclientFactoryProfiles.version10;
solaceModule.SolclientFactory.init(factoryProps);

class SolaceClient {
  private static instance: SolaceClient;
  private session: solaceModule.Session | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private connectionTimeout: number = 10000; // 10 seconds timeout

  private constructor() {}

  static getInstance(): SolaceClient {
    if (!SolaceClient.instance) {
      SolaceClient.instance = new SolaceClient();
    }
    return SolaceClient.instance;
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) {
      return;
    }

    this.connecting = true;
    console.log('Initiating Solace connection...');

    try {
      const { data: config, error: configError } = await supabase.functions.invoke('get-solace-config');

      if (configError || !config?.SOLACE_HOST_URL || !config?.SOLACE_VPN_NAME || !config?.SOLACE_USERNAME) {
        throw new Error('Invalid Solace configuration');
      }

      const properties = new solaceModule.SessionProperties({
        url: config.SOLACE_HOST_URL,
        vpnName: config.SOLACE_VPN_NAME,
        userName: config.SOLACE_USERNAME,
        password: '', // Handled through edge function
        connectTimeoutInMsecs: this.connectionTimeout,
        reconnectRetries: 3,
      });

      this.session = solaceModule.SolclientFactory.createSession(properties);

      await new Promise<void>((resolve, reject) => {
        if (!this.session) {
          reject(new Error('Failed to create Solace session'));
          return;
        }

        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.connectionTimeout);

        this.session.on(solaceModule.SessionEventCode.UP_NOTICE, () => {
          clearTimeout(connectionTimeout);
          this.connected = true;
          this.connecting = false;
          console.log('Solace client connected successfully');
          resolve();
        });

        this.session.on(solaceModule.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent) => {
          clearTimeout(connectionTimeout);
          this.connected = false;
          this.connecting = false;
          console.error('Solace connection failed:', sessionEvent.infoStr);
          reject(new Error(`Connection failed: ${sessionEvent.infoStr}`));
        });

        this.session.on(solaceModule.SessionEventCode.DISCONNECTED, () => {
          this.connected = false;
          this.connecting = false;
          console.log('Solace client disconnected');
        });

        try {
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

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.session) {
      this.session.disconnect();
      this.session = null;
      this.connected = false;
      this.connecting = false;
    }
  }

  subscribe(topic: string, callback: (message: solaceModule.Message) => void): void {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
      console.log(`Subscribing to topic: ${topic}`);
      const topicDestination = solaceModule.SolclientFactory.createTopicDestination(topic);
      this.session.subscribe(
        topicDestination,
        true,
        callback,
        10000
      );
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
}

export const solaceClient = SolaceClient.getInstance();