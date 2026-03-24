import {
  addUserSocket,
  removeUserSocket,
} from '../registry/onlineUsers.js';
import registerRoomHandlers from './room.handler.js';
import { logSocketInfo } from '../utils/socketLogger.js';

const registerConnectionHandlers = (socket) => {
  const userId = socket.data.user._id;

  addUserSocket(userId, socket.id);
  socket.join(`user:${userId}`);

  registerRoomHandlers(socket);

  logSocketInfo('connected', {
    userId,
    socketId: socket.id,
  });

  socket.on('disconnect', (reason) => {
    removeUserSocket(userId, socket.id);

    logSocketInfo('disconnected', {
      userId,
      socketId: socket.id,
      reason,
    });
  });
};

export default registerConnectionHandlers;
