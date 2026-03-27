import registerRoomHandlers from './room.handler.js';
import { logSocketInfo } from '../utils/socketLogger.js';

const registerConnectionHandlers = (socket) => {
  const userId = socket.data.user._id;

  socket.join(`user:${userId}`);

  registerRoomHandlers(socket);

  logSocketInfo('connected', {
    userId,
    socketId: socket.id,
  });

  socket.on('disconnect', (reason) => {
    logSocketInfo('disconnected', {
      userId,
      socketId: socket.id,
      reason,
    });
  });
};

export default registerConnectionHandlers;
