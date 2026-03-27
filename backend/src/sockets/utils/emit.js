import { getIO } from '../index.js';

const emitToUser = (userId, event, payload) => {
  const io = getIO();
  io.to(`user:${userId}`).emit(event, payload);
  return true;
};

const emitToRoom = (roomId, event, payload) => {
  const io = getIO();
  io.to(`room:${roomId}`).emit(event, payload);
  return true;
};

export { emitToUser, emitToRoom };
