import './src/config/dotenv.js';
import app from './app.js';
import dbConnection from './src/config/db.js';
import processHandler from './src/utils/error/processHandler.js';
import { Server } from 'socket.io';
import http from "http";

import { initSocket } from './src/socket/initsocket.js';

const port = process.env.PORT || 3000;

dbConnection();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  },
});

initSocket(io);

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

processHandler();