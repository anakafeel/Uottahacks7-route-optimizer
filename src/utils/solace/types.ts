import * as solace from 'solclientjs';

export interface SolaceConfig {
  url: string;
  vpnName: string;
  userName: string;
  password: string;
}

export type MessageCallback = (message: solace.Message) => void;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface SolaceMessage {
  topic: string;
  payload: any;
}