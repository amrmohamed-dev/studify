import './src/config/dotenv.js';
import { createServer } from 'http';
import app from './app.js';
import dbConnection from './src/config/db.js';
import processHandler from './src/utils/error/processHandler.js';
<<<<<<< youssef
import { Server } from 'socket.io';
import http from "http";

import { initSocket } from './src/socket/initsocket.js';
=======
import { initSocket } from './src/sockets/config/socket.js';
>>>>>>> develop

const port = process.env.PORT || 3000;
const httpServer = createServer(app);

dbConnection();
initSocket(httpServer);

<<<<<<< youssef
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
=======
httpServer.listen(port, () => console.log('Studify is running'));
>>>>>>> develop

processHandler();