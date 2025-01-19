import * as solaceModule from 'solclientjs';

export type MessageCallback = (message: solaceModule.Message) => void;

export interface SolaceConfig {
  url: string;
  vpnName: string;
  userName: string;
  password: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';