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

    try {
      const { data: { SOLACE_HOST_URL, SOLACE_VPN_NAME, SOLACE_USERNAME } } = await supabase.functions.invoke('get-solace-config');

      if (!SOLACE_HOST_URL || !SOLACE_VPN_NAME || !SOLACE_USERNAME) {
        throw new Error('Missing Solace configuration');
      }

      const properties = new solaceModule.SessionProperties({
        url: SOLACE_HOST_URL,
        vpnName: SOLACE_VPN_NAME,
        userName: SOLACE_USERNAME,
        password: '', // Handled through edge function
      });

      this.session = solaceModule.SolclientFactory.createSession(properties);

      if (this.session) {
        this.session.on(solaceModule.SessionEventCode.UP_NOTICE, () => {
          this.connected = true;
          this.connecting = false;
          console.log('Solace client connected');
        });

        this.session.on(solaceModule.SessionEventCode.CONNECT_FAILED_ERROR, () => {
          this.connected = false;
          this.connecting = false;
          console.error('Solace connection failed');
        });

        this.session.on(solaceModule.SessionEventCode.DISCONNECTED, () => {
          this.connected = false;
          this.connecting = false;
          console.log('Solace client disconnected');
        });

        await new Promise<void>((resolve, reject) => {
          try {
            this.session?.connect();
            resolve();
          } catch (error) {
            this.connecting = false;
            reject(error);
          }
        });
      }
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

  async publish(topic: string, message: string): Promise<void> {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
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

  subscribe(topic: string, callback: (message: solaceModule.Message) => void): void {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
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
}

export const solaceClient = SolaceClient.getInstance();