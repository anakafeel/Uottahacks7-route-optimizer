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
      console.log('Session already exists');
      return;
    }

    this.session = solaceModule.SolclientFactory.createSession(properties);
    console.log('Created new Solace session');
  }

  async connect(): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    if (this.connected || this.connecting) {
      console.log('Already connected or connecting');
      return;
    }

    this.connecting = true;
    console.log('Initiating connection...');

    return new Promise<void>((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, CONNECTION_TIMEOUT);

      this.setupSessionHandlers(resolve, reject, connectionTimeout);

      try {
        this.session!.connect();
      } catch (error) {
        clearTimeout(connectionTimeout);
        this.connecting = false;
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
      console.error('Connection failed:', sessionEvent);
      
      if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this.reconnectAttempts++;
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        setTimeout(() => this.connect(), RECONNECT_INTERVAL);
      } else {
        reject(new Error('Max reconnection attempts reached'));
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
      this.session.subscribe(topicDestination, true, callback, 10000);
      this.subscriptions.set(topic, callback);
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
      this.session.disconnect();
      this.session = null;
      this.connected = false;
      this.connecting = false;
      this.subscriptions.clear();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}