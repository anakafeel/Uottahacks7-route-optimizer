import { solace } from 'solclientjs';
import { supabase } from "@/integrations/supabase/client";

// Initialize solace module
const factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

class SolaceClient {
  private static instance: SolaceClient;
  private session: solace.Session | null = null;
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
      const properties = new solace.SessionProperties({
        url: SOLACE_HOST_URL,
        vpnName: SOLACE_VPN_NAME,
        userName: SOLACE_USERNAME,
        password: '', // We'll handle this securely through the edge function
      });

      this.session = solace.SolclientFactory.createSession(properties);

      // Define event listeners
      this.session.on(solace.SessionEventCode.UP_NOTICE, () => {
        this.connected = true;
        console.log('Solace client connected');
      });

      this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, () => {
        this.connected = false;
        console.error('Solace connection failed');
      });

      this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
        this.connected = false;
        console.log('Solace client disconnected');
      });

      // Connect
      this.session.connect();
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

  // Add methods for publishing and subscribing as needed
  async publish(topic: string, message: string): Promise<void> {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
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

  subscribe(topic: string, callback: (message: any) => void): void {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
      this.session.subscribe(
        solace.SolclientFactory.createTopicDestination(topic),
        true,
        topic,
        callback
      );
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }
}

export const solaceClient = SolaceClient.getInstance();