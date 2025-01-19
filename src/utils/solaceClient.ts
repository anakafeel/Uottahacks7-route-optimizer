import { solace } from 'solclientjs';
import { supabase } from "@/integrations/supabase/client";
import { sessionProperties } from './solace/config';

class SolaceClient {
  private session: solace.Session | null = null;
  private subscriptions: Set<string> = new Set();

  async connect(): Promise<void> {
    if (this.session?.isConnected()) {
      console.log('Already connected to Solace message router.');
      return;
    }

    try {
      // Fetch Solace configuration from Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('get-solace-config');
      
      if (error) throw error;
      
      const properties = sessionProperties(data);
      this.session = solace.createSession(properties);

      return new Promise((resolve, reject) => {
        this.session!.on(solace.SessionEventCode.UP_NOTICE, () => {
          console.log('Connected to Solace message router.');
          resolve();
        });

        this.session!.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (error) => {
          console.error('Connection failed:', error);
          reject(error);
        });

        this.session!.on(solace.SessionEventCode.DISCONNECTED, () => {
          console.log('Disconnected from Solace message router.');
          this.subscriptions.clear();
        });

        this.session!.connect();
      });
    } catch (error) {
      console.error('Error connecting to Solace:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.session?.isConnected()) {
      this.session.disconnect();
      this.subscriptions.clear();
    }
  }

  isConnected(): boolean {
    return this.session?.isConnected() || false;
  }

  async subscribe(topic: string, callback: (message: solace.Message) => void): Promise<void> {
    if (!this.session?.isConnected()) {
      await this.connect();
    }

    if (this.subscriptions.has(topic)) {
      console.log(`Already subscribed to topic: ${topic}`);
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const topicObj = solace.SolclientFactory.createTopic(topic);
        
        this.session!.subscribe(
          topicObj,
          true,
          topic,
          10000,
          (error) => {
            if (error) {
              console.error(`Subscribe error: ${error}`);
              reject(error);
              return;
            }
            console.log(`Subscribed to topic: ${topic}`);
            this.subscriptions.add(topic);
            this.session!.on(solace.SessionEventCode.MESSAGE, callback);
            resolve();
          }
        );
      } catch (error) {
        console.error('Error in subscribe:', error);
        reject(error);
      }
    });
  }

  async publish(topic: string, message: string): Promise<void> {
    if (!this.session?.isConnected()) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      try {
        const topicObj = solace.SolclientFactory.createTopic(topic);
        const msg = solace.SolclientFactory.createMessage();
        msg.setDestination(topicObj);
        msg.setBinaryAttachment(message);
        msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
        
        this.session!.send(msg);
        console.log(`Published message to topic: ${topic}`);
        resolve();
      } catch (error) {
        console.error('Error in publish:', error);
        reject(error);
      }
    });
  }
}

export const solaceClient = new SolaceClient();