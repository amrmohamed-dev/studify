import Room from "./room.model.js";

export const joinRoom = async (userId, roomId) => {
  const room = await Room.findById(roomId);

  if (!room) throw new Error("Room not found");


  const isMember = room.members.find(
    m => m.user.toString() === userId.toString()
  );

  if (isMember) throw new Error("Already a member");

  const isPending = room.pendingMembers.find(
    p => p.user.toString() === userId.toString()
  );

  if (isPending) throw new Error("Already requested");


  if (room.isPrivate) {
    room.pendingMembers.push({ user: userId });
    await room.save();

    return { message: "Request sent" };
  }


  if (room.maxMembers && room.members.length >= room.maxMembers) {
    throw new Error("Room is full");
  }

  room.members.push({
    user: userId,
    role: "member"
  });

  await room.save();

  return { message: "Joined successfully" };
};

// -----------------------------

export const approveMember = async (currentUser, roomId, userId) => {
  const room = await Room.findById(roomId);

  if (!room) throw new Error("Room not found");

  const isAdmin = room.members.find(
    m =>
      m.user.toString() === currentUser.toString() &&
      m.role === "admin"
  );

  if (!isAdmin) throw new Error("Not authorized");

  const index = room.pendingMembers.findIndex(
    p => p.user.toString() === userId
  );

  if (index === -1) throw new Error("User not in pending");

  const user = room.pendingMembers[index];

  room.pendingMembers.splice(index, 1);

  room.members.push({
    user: user.user,
    role: "member"
  });

  await room.save();

  return { message: "User approved" };
};

// -----------------------------

export const removeMember = async (currentUser, roomId, userId) => {
  const room = await Room.findById(roomId);

  if (!room) throw new Error("Room not found");

  const isAdmin = room.members.find(
    m =>
      m.user.toString() === currentUser.toString() &&
      m.role === "admin"
  );

  if (!isAdmin && currentUser.toString() !== userId) {
    throw new Error("Not authorized");
  }

  room.members = room.members.filter(
    m => m.user.toString() !== userId
  );

  await room.save();

  return { message: "Member removed" };
};

// -----------------------------

export const getMembers = async (roomId) => {
  const room = await Room.findById(roomId)
    .populate("members.user", "name email image");

  if (!room) throw new Error("Room not found");

  return { members: room.members };
};

// -----------------------------

export const getPending = async (roomId) => {
  const room = await Room.findById(roomId)
    .populate("pendingMembers.user", "name email image");

  if (!room) throw new Error("Room not found");

  return { pending: room.pendingMembers };
};