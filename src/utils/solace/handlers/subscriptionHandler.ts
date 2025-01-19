import * as solaceModule from 'solclientjs';
import type { Session } from 'solclientjs';
import type { MessageCallback, SubscriptionConfig } from '../types/events';

export class SubscriptionHandler {
  private subscriptions: Map<string, MessageCallback> = new Map();
  
  constructor(private session: Session) {}

  async subscribe({ topic, callback, requestConfirmation = true }: SubscriptionConfig): Promise<void> {
    try {
      console.log(`Subscribing to topic: ${topic}`);
      const topicDestination = solaceModule.SolclientFactory.createTopicDestination(topic);
      
      await new Promise<void>((resolve, reject) => {
        this.session.subscribe(
          topicDestination,
          requestConfirmation,
          { correlationKey: topic }, // Using an object with correlationKey as required by Solace API
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

      // Set up message event handler
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

  async resubscribeAll(): Promise<void> {
    for (const [topic, callback] of this.subscriptions.entries()) {
      try {
        await this.subscribe({ topic, callback });
        console.log(`Resubscribed to topic: ${topic}`);
      } catch (error) {
        console.error(`Error resubscribing to topic ${topic}:`, error);
      }
    }
  }

  clearSubscriptions(): void {
    this.subscriptions.clear();
  }
}