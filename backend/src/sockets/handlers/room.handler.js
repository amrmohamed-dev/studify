import SOCKET_EVENTS from '../constants.js';
import Room from '../../modules/room/room.model.js';
import { messageModel } from '../../modules/message/message.model.js';

const registerRoomHandlers = (socket) => {
  const userId = socket.data.user._id;

  socket.on(SOCKET_EVENTS.ROOM_JOIN, async ({ roomId } = {}) => {
    try {
      if (!roomId) return;

      const room = await Room.findById(roomId).select('createdBy members');
      if (!room) {
        return socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room not found',
        });
      }

      const isMember = room.members.some(
        (m) => m.user.toString() === userId.toString(),
      );
      const isOwner = room.createdBy.toString() === userId.toString();

      if (!isMember && !isOwner) {
        return socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Unauthorized room access',
        });
      }

      socket.join(`room:${roomId}`);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join room' });
    }
  });

  socket.on(SOCKET_EVENTS.ROOM_MESSAGE, async ({ roomId, content }) => {
    try {
      if (!roomId || !content) return;

      const message = await messageModel.create({
        room: roomId,
        sender: userId,
        content,
      });

      const populatedMessage = await message.populate('sender', 'name');

      socket.nsp
        .to(`room:${roomId}`)
        .emit(SOCKET_EVENTS.ROOM_MESSAGE, populatedMessage);
    } catch (err) {
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to send message',
      });
    }
  });

  socket.on(SOCKET_EVENTS.ROOM_LEAVE, async ({ roomId } = {}) => {
    try {
      if (!roomId) return;
      socket.leave(`room:${roomId}`);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to leave room',
      });
    }
  });
};

export default registerRoomHandlers;
