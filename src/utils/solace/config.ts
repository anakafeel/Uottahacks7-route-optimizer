import solace from 'solclientjs';

export const sessionProperties = (config: any) => ({
  url: config.hostUrl,
  vpnName: config.vpnName,
  userName: config.username,
  password: config.password,
  connectTimeoutInMsecs: 10000,
  reconnectRetries: 10,
  reconnectRetryWaitInMsecs: 3000,
  generateSequenceNumber: true,
  applicationDescription: 'Route Optimizer',
  logLevel: solace.LogLevel.INFO
});