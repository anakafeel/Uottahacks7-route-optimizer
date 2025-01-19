import * as solaceModule from 'solclientjs';
import { supabase } from "@/integrations/supabase/client";

// Create a local reference to the solace module after initialization
const factoryProps = new solaceModule.SolclientFactoryProperties();
factoryProps.profile = solaceModule.SolclientFactoryProfiles.version10;
solaceModule.SolclientFactory.init(factoryProps);

class SolaceClient {
  private static instance: SolaceClient;
  private session: solaceModule.Session | null = null;
  private connected: boolean = false;

  private constructor() {}

  static getInstance(): SolaceClient {
    if (!SolaceClient.instance) {
      SolaceClient.instance = new SolaceClient();
    }
    return SolaceClient.instance;
  }

  async connect(): Promise<void> {
    try {
      const { data: { SOLACE_HOST_URL, SOLACE_VPN_NAME, SOLACE_USERNAME } } = await supabase.functions.invoke('get-solace-config');

      if (!SOLACE_HOST_URL || !SOLACE_VPN_NAME || !SOLACE_USERNAME) {
        throw new Error('Missing Solace configuration');
      }

      // Create session
      const properties = new solaceModule.SessionProperties({
        url: SOLACE_HOST_URL,
        vpnName: SOLACE_VPN_NAME,
        userName: SOLACE_USERNAME,
        password: '', // We'll handle this securely through the edge function
      });

      this.session = solaceModule.SolclientFactory.createSession(properties);

      // Define event listeners
      if (this.session) {
        this.session.on(solaceModule.SessionEventCode.UP_NOTICE, () => {
          this.connected = true;
          console.log('Solace client connected');
        });

        this.session.on(solaceModule.SessionEventCode.CONNECT_FAILED_ERROR, () => {
          this.connected = false;
          console.error('Solace connection failed');
        });

        this.session.on(solaceModule.SessionEventCode.DISCONNECTED, () => {
          this.connected = false;
          console.log('Solace client disconnected');
        });

        // Connect
        await new Promise<void>((resolve, reject) => {
          try {
            this.session?.connect();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      }
    } catch (error) {
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

  subscribe(topic: string, callback: (message: any) => void): void {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
      const messageCallback = (message: solaceModule.Message) => {
        callback(message);
      };

      this.session.subscribe(
        solaceModule.SolclientFactory.createTopicDestination(topic),
        true,
        topic,
        messageCallback
      );
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }
}

export const solaceClient = SolaceClient.getInstance();