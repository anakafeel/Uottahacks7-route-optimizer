export default {
  userName: process.env.SOLACE_USERNAME || "",
  password: process.env.SOLACE_PASSWORD || "",
  invocationContext: {
    host: process.env.SOLACE_HOST_URL || "",
    port: 8443,
    clientId: `solace-client-${Math.random().toString(36).substring(2, 15)}`
  },
  timeout: 3,
  keepAliveInterval: 60,
  cleanSession: true,
  useSSL: true,
  reconnect: true
};