import Paho from "paho-mqtt";
import options from "./messaging-options";

class Messaging extends Paho.Client {
  private callbacks: ((message: Paho.Message) => void)[] = [];

  constructor() {
    super(
      options.invocationContext.host,
      Number(options.invocationContext.port),
      options.invocationContext.clientId
    );
    this.onMessageArrived = this.handleMessage.bind(this);
    this.onConnectionLost = this.handleConnectionLost.bind(this);
  }

  connectWithPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      const connectOptions = {
        ...options,
        onSuccess: resolve,
        onFailure: reject,
      };
      this.connect(connectOptions);
    });
  }

  handleConnectionLost(responseObject: { errorCode: number; errorMessage?: string }) {
    if (responseObject.errorCode !== 0) {
      console.log("Connection lost with Solace Cloud:", responseObject.errorMessage);
    }
  }

  register(callback: (message: Paho.Message) => void) {
    this.callbacks.push(callback);
  }

  handleMessage(message: Paho.Message) {
    console.log("Received message:", message.payloadString);
    this.callbacks.forEach(callback => callback(message));
  }

  subscribe(topic: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        super.subscribe(topic, {
          onSuccess: () => {
            console.log(`Successfully subscribed to ${topic}`);
            resolve();
          },
          onFailure: (error) => {
            console.error(`Error subscribing to ${topic}:`, error);
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  publish(topic: string, payload: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        const message = new Paho.Message(payload);
        message.destinationName = topic;
        super.send(message);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const messaging = new Messaging();