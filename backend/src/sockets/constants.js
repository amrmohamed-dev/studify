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
  ROOM_JOIN_REQUEST: 'room:join-request',
  ROOM_APPROVED: 'room:approved',
  ROOM_REJECTED: 'room:rejected',
  ROOM_MEMBER_JOINED: 'room:member-joined',
  ROOM_MEMBER_LEFT: 'room:member-left',
  ROOM_KICKED: 'room:kicked',
  ROOM_UPDATED: 'room:updated',
};

export default SOCKET_EVENTS;
