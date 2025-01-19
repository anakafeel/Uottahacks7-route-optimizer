import Paho from "paho-mqtt";
import options from "./messaging-options";

class Messaging extends Paho.Client {
  private callbacks: ((message: Paho.Message) => void)[] = [];
  private _connected: boolean = false;

  constructor() {
    super(
      options.invocationContext.host,
      Number(options.invocationContext.port),
      options.invocationContext.clientId
    );

    // Set up message handlers using the proper Paho Client methods
    this.onMessageArrived = (message: Paho.Message) => this.handleMessage(message);
    this.onConnectionLost = (responseObject: { errorCode: number; errorMessage?: string }) => 
      this.handleConnectionLost(responseObject);
  }

  connectWithPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      const connectOptions = {
        ...options,
        onSuccess: () => {
          this._connected = true;
          resolve();
        },
        onFailure: reject,
      };
      super.connect(connectOptions);
    });
  }

  connect(): Promise<void> {
    return this.connectWithPromise();
  }

  handleConnectionLost(responseObject: { errorCode: number; errorMessage?: string }) {
    this._connected = false;
    if (responseObject.errorCode !== 0) {
      console.log("Connection lost with Solace Cloud:", responseObject.errorMessage);
    }
  }

  disconnect(): void {
    if (this._connected) {
      super.disconnect();
      this._connected = false;
    }
  }

  isConnected(): boolean {
    return this._connected;
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