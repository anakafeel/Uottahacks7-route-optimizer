import * as solaceModule from 'solclientjs';

export interface SolaceConfig {
  url: string;
  vpnName: string;
  userName: string;
}

export interface SolaceMessage {
  topic: string;
  payload: any;
}

export type MessageCallback = (message: solaceModule.Message) => void;