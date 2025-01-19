import * as solaceModule from 'solclientjs';
import { CONNECTION_TIMEOUT, MAX_RECONNECT_ATTEMPTS, RECONNECT_INTERVAL } from './config';
import type { MessageCallback } from './types';

export class ConnectionManager {
  private session: solaceModule.Session | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private reconnectAttempts: number = 0;
  private subscriptions: Map<string, MessageCallback> = new Map();

  async setupSession(properties: solaceModule.SessionProperties): Promise<void> {
    if (this.session) {
      console.log('Session already exists, cleaning up...');
      try {
        this.session.dispose();
      } catch (error) {
        console.warn('Error disposing existing session:', error);
      }
    }

    this.session = solaceModule.SolclientFactory.createSession(properties);
    console.log('Created new Solace session with properties:', {
      url: properties.url,
      vpnName: properties.vpnName,
      connectTimeout: properties.connectTimeoutInMsecs,
      reconnectRetries: properties.reconnectRetries
    });
  }

  async connect(): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    if (this.connected) {
      console.log('Already connected');
      return;
    }

    if (this.connecting) {
      console.log('Connection already in progress');
      return;
    }

    this.connecting = true;
    console.log('Initiating connection...');

    return new Promise<void>((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        this.connecting = false;
        reject(new Error('Connection timeout after ' + CONNECTION_TIMEOUT + 'ms'));
      }, CONNECTION_TIMEOUT);

      this.setupSessionHandlers(resolve, reject, connectionTimeout);

      try {
        console.log('Attempting to connect session...');
        this.session!.connect();
      } catch (error) {
        clearTimeout(connectionTimeout);
        this.connecting = false;
        console.error('Error during connect():', error);
        reject(error);
      }
    });
  }

  private setupSessionHandlers(
    resolve: () => void,
    reject: (error: Error) => void,
    connectionTimeout: NodeJS.Timeout
  ): void {
    if (!this.session) return;

    this.session.on(solaceModule.SessionEventCode.UP_NOTICE, () => {
      clearTimeout(connectionTimeout);
      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;
      console.log('Successfully connected to Solace');
      this.reapplySubscriptions();
      resolve();
    });

    this.session.on(solaceModule.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent) => {
      clearTimeout(connectionTimeout);
      this.connected = false;
      this.connecting = false;
      const errorMessage = sessionEvent.toString();
      console.error('Connection failed:', errorMessage);
      
      if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this.reconnectAttempts++;
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        setTimeout(() => this.connect(), RECONNECT_INTERVAL);
      } else {
        reject(new Error(`Connection failed: ${errorMessage}`));
      }
    });

    this.session.on(solaceModule.SessionEventCode.DISCONNECTED, () => {
      this.connected = false;
      this.connecting = false;
      console.log('Disconnected from Solace');
      
      if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this.reconnectAttempts++;
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        setTimeout(() => this.connect(), RECONNECT_INTERVAL);
      }
    });
  }

  async subscribe(topic: string, callback: MessageCallback): Promise<void> {
    if (!this.session || !this.connected) {
      throw new Error('Not connected to Solace');
    }

    try {
      console.log(`Subscribing to topic: ${topic}`);
      const topicDestination = solaceModule.SolclientFactory.createTopicDestination(topic);
      await new Promise<void>((resolve, reject) => {
        // Updated subscribe call to match the expected number of arguments
        this.session!.subscribe(
          topicDestination,
          true, // requestConfirmation
          topic, // correlationKey
          (error) => {
            if (error) {
              console.error(`Error subscribing to ${topic}:`, error);
              reject(error);
            } else {
              console.log(`Successfully subscribed to ${topic}`);
              this.subscriptions.set(topic, callback);
              resolve();
            }
          }
        );
      });

      // Set up message event handler for this subscription
      this.session.on(solaceModule.SessionEventCode.MESSAGE, (message) => {
        if (message.getDestination().getName() === topic) {
          callback(message);
        }
      });
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  private async reapplySubscriptions(): Promise<void> {
    if (!this.session || !this.connected) return;

    for (const [topic, callback] of this.subscriptions.entries()) {
      try {
        await this.subscribe(topic, callback);
        console.log(`Resubscribed to topic: ${topic}`);
      } catch (error) {
        console.error(`Error resubscribing to topic ${topic}:`, error);
      }
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

  disconnect(): void {
    if (this.session) {
      try {
        this.session.disconnect();
      } catch (error) {
        console.error('Error during disconnect:', error);
      } finally {
        this.session = null;
        this.connected = false;
        this.connecting = false;
        this.subscriptions.clear();
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}