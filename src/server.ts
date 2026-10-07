import http from 'http';
import app from './app';
import { initializeSocketIO } from './socket/socketInit';
import config from './config/config';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocketIO(server);

// Start the server
const startServer = () => {
  server.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
};

export default startServer;
