export default {
  userName: import.meta.env.VITE_SOLACE_USERNAME || "",
  password: import.meta.env.VITE_SOLACE_PASSWORD || "",
  invocationContext: {
    host: import.meta.env.VITE_SOLACE_HOST_URL || "",
    port: 8443,
    clientId: `solace-client-${Math.random().toString(36).substring(2, 15)}`
  },
  timeout: 3,
  keepAliveInterval: 60,
  cleanSession: true,
  useSSL: true,
  reconnect: true
};