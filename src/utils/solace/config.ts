import * as solaceModule from 'solclientjs';

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
    url: config.url,
    vpnName: config.vpnName,
    userName: config.userName,
    password: config.password,
    connectTimeoutInMsecs: 10000,
    reconnectRetries: 3,
    generateSendTimestamps: true,
    generateReceiveTimestamps: true,
    reapplySubscriptions: true,
    keepAliveIntervalInMsecs: 3000,
    keepAliveIntervalsLimit: 10,
  });
};