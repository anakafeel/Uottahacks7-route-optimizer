import * as solace from 'solclientjs';
import { supabase } from "@/integrations/supabase/client";
import { initializeSolaceFactory, sessionProperties } from './solace/config';

interface ExtendedSessionProperties extends solace.SessionProperties {
  connectTimeoutInMsecs?: number; // Add your custom properties here
}

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
        console.log("Already connected or connecting to Solace.");
        return;
    }

    this.connecting = true;
    console.log("Initiating Solace connection...");

    try {
        const { data: config, error: configError } = await supabase.functions.invoke("get-solace-config");

        if (configError || !config) {
            throw new Error("Failed to get Solace configuration");
        }

        console.log("Retrieved Solace configuration", config);

        const properties = {
          url: `wss://${config.SOLACE_HOST_URL}`,
            vpnName: config.SOLACE_VPN_NAME,
            userName: config.SOLACE_USERNAME,
            password: config.SOLACE_PASSWORD,
        };

        this.session = solace.SolclientFactory.createSession(properties);

        await new Promise<void>((resolve, reject) => {
            if (!this.session) {
                reject(new Error("Failed to create Solace session"));
                return;
            }

            // Add manual timeout for the connection
            const connectionTimeout = setTimeout(() => {
                reject(new Error("Connection timed out"));
            }, 15000);

            this.session.on(solace.SessionEventCode.UP_NOTICE, () => {
                clearTimeout(connectionTimeout);
                this.connected = true;
                this.connecting = false;
                console.log("Successfully connected to Solace");
                resolve();
            });

            this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent: solace.SessionEvent) => {
              clearTimeout(connectionTimeout);
              this.connected = false;
              this.connecting = false;
          
              console.error("Connection failed:", sessionEvent.infoStr);
              reject(new Error(`Connection failed: ${sessionEvent.infoStr}`));
          });
          
            console.log("Attempting to connect session...");
            this.session.connect(); // Start the connection
        });
    } catch (error) {
        this.connecting = false;
        console.error("Error connecting to Solace:", error);
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
      msg.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);
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