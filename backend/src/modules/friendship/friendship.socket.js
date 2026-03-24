import { emitToUser } from '../../sockets/utils/emit.js';
import SOCKET_EVENTS from '../../sockets/constants.js';

const emitFriendRequest = (recipientId, payload) =>
  emitToUser(recipientId, SOCKET_EVENTS.FRIEND_REQUEST, payload);

const emitFriendAccepted = (requesterId, payload) =>
  emitToUser(requesterId, SOCKET_EVENTS.FRIEND_ACCEPTED, payload);

export { emitFriendRequest, emitFriendAccepted };
