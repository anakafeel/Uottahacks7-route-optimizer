import solace from 'solclientjs';

// Constants for connection management
export const CONNECTION_TIMEOUT = 10000;
export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_INTERVAL = 3000;

export const initializeSolaceFactory = () => {
  var factoryProps = new solace.SolclientFactoryProperties();
  factoryProps.profile = solace.SolclientFactoryProfiles.version10;
  solace.SolclientFactory.init(factoryProps);
};

export const sessionProperties = (config: any) => ({
  url: config.hostUrl,
  vpnName: config.vpnName,
  userName: config.username,
  password: config.password,
  connectTimeoutInMsecs: CONNECTION_TIMEOUT,
  reconnectRetries: MAX_RECONNECT_ATTEMPTS,
  reconnectRetryWaitInMsecs: RECONNECT_INTERVAL,
  generateSequenceNumber: true,
  applicationDescription: 'Route Optimizer',
  logLevel: solace.LogLevel.INFO
});

// Alias for backward compatibility
export const createSessionProperties = sessionProperties;