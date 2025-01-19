import * as solaceModule from 'solclientjs';
import type { Session, SessionProperties } from 'solclientjs';

export class ConnectionHandler {
  private session: Session | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private reconnectAttempts: number = 0;
  
  async setupSession(properties: SessionProperties): Promise<void> {
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
      const timeout = setTimeout(() => {
        this.connecting = false;
        reject(new Error('Connection timeout'));
      }, 30000);

      this.setupSessionHandlers(resolve, reject, timeout);

      try {
        console.log('Attempting to connect session...');
        this.session!.connect();
      } catch (error) {
        clearTimeout(timeout);
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
      resolve();
    });

    this.session.on(solaceModule.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent) => {
      clearTimeout(connectionTimeout);
      this.connected = false;
      this.connecting = false;
      const errorMessage = sessionEvent.toString();
      console.error('Connection failed:', errorMessage);
      reject(new Error(`Connection failed: ${errorMessage}`));
    });

    this.session.on(solaceModule.SessionEventCode.DISCONNECTED, () => {
      this.connected = false;
      this.connecting = false;
      console.log('Disconnected from Solace');
    });
  }

  isConnected(): boolean {
    return this.connected;
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
      }
    }
  }
}