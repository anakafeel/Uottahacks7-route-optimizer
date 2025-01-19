import solace from 'solclientjs';

// Constants for connection management
export const CONNECTION_TIMEOUT = 10000;
export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_INTERVAL = 3000;

export const initializeSolaceFactory = () => {
  const factoryProps = new solace.SolclientFactoryProperties();
  factoryProps.profile = solace.SolclientFactoryProfiles.version10;
  solace.SolclientFactory.init(factoryProps);
};

export const sessionProperties = (config: {
  url: string;
  vpnName: string;
  userName: string;
  password: string;
}) => ({
  url: `wss://${config.url}:443`,
  vpnName: config.vpnName,
  userName: config.userName,
  password: config.password,
  connectTimeoutInMsecs: CONNECTION_TIMEOUT,
  reconnectRetries: MAX_RECONNECT_ATTEMPTS,
  reconnectRetryWaitInMsecs: RECONNECT_INTERVAL,
  generateSequenceNumber: true,
  applicationDescription: 'Route Optimizer',
  logLevel: solace.LogLevel.DEBUG // Changed to DEBUG for better logging
});

// Alias for backward compatibility
export const createSessionProperties = sessionProperties;