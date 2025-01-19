import * as solaceModule from 'solclientjs';

export type MessageCallback = (message: solaceModule.Message) => void;

export interface SolaceConfig {
  url: string;
  vpnName: string;
  userName: string;
  password: string;
}

export interface SolaceMessage {
  topic: string;
  payload: any;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';