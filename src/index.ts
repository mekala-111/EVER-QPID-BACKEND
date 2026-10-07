import './models';
import app from './app';
import routes from './routes/routes';
import connection from './db_connection/mongodb/connection';
import config from './config/config';
import errorMiddleware from './middlewares/web_server/error-middleware';
import { initSchedular } from './utils/schedular-service';
import startServer from './server';
import dns from 'node:dns/promises';

if (process.env.FORCE_DNS === 'true') {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

// Routes for each endpoint
routes(app);

// Database connection
connection(config).connectToMongo();

// Use the error handling middleware
app.use(errorMiddleware);

// Initialize schedular
initSchedular();

// Start the server
startServer();
