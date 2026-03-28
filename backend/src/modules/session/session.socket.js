import { emitToRoom } from '../../sockets/utils/emit.js';
import SOCKET_EVENTS from '../../sockets/constants.js';

const emitSessionStarted = (roomId, payload) => {
  emitToRoom(roomId, SOCKET_EVENTS.SESSION_STARTED, payload);
};

const emitSessionEnded = (roomId, payload) => {
  emitToRoom(roomId, SOCKET_EVENTS.SESSION_ENDED, payload);
};

export { emitSessionStarted, emitSessionEnded };
