const onlineUsers = new Map();

const addUserSocket = (userId, socketId) => {
  const key = userId.toString();
  const sockets = onlineUsers.get(key) || new Set();

  sockets.add(socketId);
  onlineUsers.set(key, sockets);
};

const removeUserSocket = (userId, socketId) => {
  const key = userId.toString();
  const sockets = onlineUsers.get(key);

  if (!sockets) return;

  sockets.delete(socketId);

  if (!sockets.size) {
    onlineUsers.delete(key);
  }
};

const getUserSockets = (userId) =>
  onlineUsers.get(userId.toString()) || new Set();

const isUserOnline = (userId) => getUserSockets(userId).size > 0;

export {
  onlineUsers,
  addUserSocket,
  removeUserSocket,
  getUserSockets,
  isUserOnline,
};
