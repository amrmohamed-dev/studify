import SOCKET_EVENTS from '../constants.js';

const registerRoomHandlers = (socket) => {
  socket.on(SOCKET_EVENTS.ROOM_JOIN, ({ roomId } = {}) => {
    if (!roomId) return;

    socket.join(`room:${roomId}`);
  });

  socket.on(SOCKET_EVENTS.ROOM_LEAVE, ({ roomId } = {}) => {
    if (!roomId) return;

    socket.leave(`room:${roomId}`);
  });
};

export default registerRoomHandlers;
