import * as solaceModule from 'solclientjs';

export const CONNECTION_TIMEOUT = 30000; // 30 seconds
export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_INTERVAL = 5000; // 5 seconds

export const initializeSolaceFactory = () => {
  const factoryProps = new solaceModule.SolclientFactoryProperties();
  factoryProps.profile = solaceModule.SolclientFactoryProfiles.version10;
  solaceModule.SolclientFactory.init(factoryProps);
};

export const createSessionProperties = (config: {
  url: string;
  vpnName: string;
  userName: string;
  password: string;
}) => {
  return new solaceModule.SessionProperties({
    url: `wss://${config.url}:443`,
    vpnName: config.vpnName,
    userName: config.userName,
    password: config.password,
    connectTimeoutInMsecs: CONNECTION_TIMEOUT,
    reconnectRetries: MAX_RECONNECT_ATTEMPTS,
    generateSendTimestamps: true,
    generateReceiveTimestamps: true,
    reapplySubscriptions: true,
    keepAliveIntervalInMsecs: 3000,
    keepAliveIntervalsLimit: 10,
    connectRetries: MAX_RECONNECT_ATTEMPTS,
    reconnectRetryWaitInMsecs: RECONNECT_INTERVAL,
  });
};