import type { Message, Session, SessionEventCode } from 'solclientjs';

export type MessageCallback = (message: Message) => void;
export type SessionEventHandler = (session: Session, eventCode: SessionEventCode, message: string) => void;
export type ErrorCallback = (error: Error | null) => void;

export interface SubscriptionConfig {
  topic: string;
  callback: MessageCallback;
  requestConfirmation?: boolean;
  timeout?: number;
}