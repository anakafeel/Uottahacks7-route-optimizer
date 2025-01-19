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
}) => {
  // Log the configuration being used (without sensitive data)
  console.log('Creating Solace session with config:', {
    url: config.url,
    vpnName: config.vpnName,
    hasUsername: !!config.userName,
    hasPassword: !!config.password
  });

  return {
    // Ensure proper WebSocket URL formatting
    url: config.url.startsWith('ws://') || config.url.startsWith('wss://') 
      ? config.url 
      : `wss://${config.url}`,  // Removed :443 as it's often included in the URL
    vpnName: config.vpnName,
    userName: config.userName,
    password: config.password,
    connectTimeoutInMsecs: CONNECTION_TIMEOUT,
    reconnectRetries: MAX_RECONNECT_ATTEMPTS,
    reconnectRetryWaitInMsecs: RECONNECT_INTERVAL,
    generateSequenceNumber: true,
    applicationDescription: 'Route Optimizer',
    logLevel: solace.LogLevel.TRACE, // Set to TRACE for maximum logging
    ssl: {
      enabled: true,
      validateCertificate: false,
    }
  };
};

// Alias for backward compatibility
export const createSessionProperties = sessionProperties;