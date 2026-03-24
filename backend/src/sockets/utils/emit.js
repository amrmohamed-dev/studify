import { getIO } from '../index.js';
import { getUserSockets } from '../registry/onlineUsers.js';

const emitToUser = (userId, event, payload) => {
  const socketIds = getUserSockets(userId);

  if (!socketIds.size) return false;

  const io = getIO();

  for (const socketId of socketIds) {
    io.to(socketId).emit(event, payload);
  }

  return true;
};

const emitToRoom = (roomId, event, payload) => {
  const io = getIO();

  io.to(`room:${roomId}`).emit(event, payload);
  return true;
};

export { emitToUser, emitToRoom };
