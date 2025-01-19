import solace from 'solclientjs';
import type { SolaceConfig } from './types';

export const CONNECTION_TIMEOUT = 30000;
export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_INTERVAL = 3000;

export const initializeSolaceFactory = () => {
  const factoryProps = new solace.SolclientFactoryProperties();
  factoryProps.profile = solace.SolclientFactoryProfiles.version10;
  solace.SolclientFactory.init(factoryProps);
};

export const sessionProperties = (config: SolaceConfig) => {
  console.log('Creating Solace session with config:', {
    url: config.url,
    vpnName: config.vpnName,
    hasUsername: !!config.userName,
    hasPassword: !!config.password
  });

  // Ensure proper WebSocket URL formatting
  const wsUrl = config.url.includes('://') 
    ? config.url 
    : `wss://${config.url}:443`;

  console.log('Using WebSocket URL:', wsUrl);

  return {
    url: wsUrl,
    vpnName: config.vpnName,
    userName: config.userName,
    password: config.password,
    connectTimeoutInMsecs: CONNECTION_TIMEOUT,
    reconnectRetries: MAX_RECONNECT_ATTEMPTS,
    reconnectRetryWaitInMsecs: RECONNECT_INTERVAL,
    generateSequenceNumber: true,
    applicationDescription: 'Route Optimizer',
    logLevel: solace.LogLevel.DEBUG,
    ssl: {
      enabled: true,
      validateCertificate: false,
    }
  };
};