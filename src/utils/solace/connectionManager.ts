import * as solaceModule from 'solclientjs';
import type { SessionProperties } from 'solclientjs';
import type { MessageCallback } from './types/events';
import { ConnectionHandler } from './handlers/connectionHandler';

export class ConnectionManager {
  private connectionHandler: ConnectionHandler;

  constructor() {
    this.connectionHandler = new ConnectionHandler();
  }

  async setupSession(properties: SessionProperties): Promise<void> {
    await this.connectionHandler.setupSession(properties);
  }

  async connect(): Promise<void> {
    return this.connectionHandler.connect();
  }

  async subscribe(topic: string, callback: MessageCallback): Promise<void> {
    if (!this.connectionHandler.isConnected()) {
      throw new Error('Not connected to Solace');
    }
    
    try {
      console.log(`Subscribing to topic: ${topic}`);
      // Implementation using direct session subscription
      // TODO: Add proper typing for session access
      (this.connectionHandler as any).session?.subscribe(topic, callback);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  async publish(topic: string, message: string): Promise<void> {
    if (!this.connectionHandler.isConnected()) {
      throw new Error('Not connected to Solace');
    }

    try {
      console.log(`Publishing to topic: ${topic}`, message);
      const msg = solaceModule.SolclientFactory.createMessage();
      msg.setDestination(solaceModule.SolclientFactory.createTopicDestination(topic));
      msg.setBinaryAttachment(message);
      msg.setDeliveryMode(solaceModule.MessageDeliveryModeType.DIRECT);
      // TODO: Add proper typing for session access
      (this.connectionHandler as any).session?.send(msg);
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  }

  disconnect(): void {
    this.connectionHandler.disconnect();
  }

  isConnected(): boolean {
    return this.connectionHandler.isConnected();
  }
}