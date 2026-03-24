import './src/config/dotenv.js';
import { createServer } from 'http';
import app from './app.js';
import dbConnection from './src/config/db.js';
import processHandler from './src/utils/error/processHandler.js';
import { initSocket } from './src/sockets/config/socket.js';

const port = process.env.PORT || 3000;
const httpServer = createServer(app);

dbConnection();
initSocket(httpServer);

httpServer.listen(port, () => console.log('Studify is running'));

processHandler();
