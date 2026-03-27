const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'app:error',
  NOTIFICATION: 'notification',
  NOTIFICATION_NEW: 'notification:new',
  FRIEND_REQUEST: 'friend:request',
  FRIEND_ACCEPTED: 'friend:accepted',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
};

export default SOCKET_EVENTS;
