import Room from '../room/room.model.js';
import AppError from '../../utils/error/appError.js';
import validateObjectId from '../../utils/validateObjectId.js';

const getUserId = (value) =>
  value?._id?.toString?.() || value?.toString?.() || null;

const findRoomById = async (roomId, query = Room.findById(roomId)) => {
  validateObjectId(roomId, 'room id');

  const room = await query;

  if (!room) {
    throw new AppError('Room not found.', 404);
  }

  return room;
};

const findMember = (room, userId) =>
  room.members.find(
    (member) => getUserId(member.user) === userId.toString(),
  );

const findPendingMember = (room, userId) =>
  room.pendingMembers.find(
    (pendingMember) => getUserId(pendingMember.user) === userId.toString(),
  );

const ensureAdmin = (room, userId) => {
  if (!room.createdBy.equals(userId)) {
    throw new AppError(
      'You are not authorized to manage room members.',
      403,
    );
  }
};

const ensureMember = (room, userId) => {
  if (room.createdBy.equals(userId)) {
    return null;
  }

  const member = findMember(room, userId);

  if (!member) {
    throw new AppError('You are not a member of this room.', 403);
  }

  return member;
};

const ensureRoomHasCapacity = (room) => {
  if (room.maxMembers && room.members.length >= room.maxMembers) {
    throw new AppError('This room is full.', 409);
  }
};

const joinRoom = async ({ userId, roomId, password }) => {
  validateObjectId(userId, 'user id');

  const room = await findRoomById(
    roomId,
    Room.findById(roomId).select('+password'),
  );

  if (room.createdBy.equals(userId)) {
    return {
      room,
      message: 'Room owner already has access to this room.',
    };
  }

  if (findMember(room, userId)) {
    throw new AppError('You are already a member of this room.', 409);
  }

  if (findPendingMember(room, userId)) {
    throw new AppError('You already have a pending join request.', 409);
  }

  if (room.privacyType === 'private_request') {
    room.pendingMembers.push({ user: userId });
    await room.save({ validateModifiedOnly: true });

    return {
      room: null,
      message: 'Join request sent successfully.',
    };
  }

  if (room.privacyType === 'private_password') {
    if (!password) {
      throw new AppError('Room password is required.', 400);
    }

    const isCorrectPassword = await room.correctPassword(password);

    if (!isCorrectPassword) {
      throw new AppError('Incorrect room password.', 401);
    }
  }

  ensureRoomHasCapacity(room);

  room.members.push({
    user: userId,
  });

  await room.save({ validateModifiedOnly: true });

  return {
    room,
    message: 'Joined room successfully.',
  };
};

const approveMember = async ({ currentUserId, roomId, userId }) => {
  validateObjectId(currentUserId, 'current user id');
  validateObjectId(userId, 'user id');

  const room = await findRoomById(roomId);

  ensureAdmin(room, currentUserId);
  ensureRoomHasCapacity(room);

  if (findMember(room, userId)) {
    throw new AppError('User is already a room member.', 409);
  }

  const pendingMemberIndex = room.pendingMembers.findIndex(
    (pendingMember) => getUserId(pendingMember.user) === userId.toString(),
  );

  if (pendingMemberIndex === -1) {
    throw new AppError('Pending member not found.', 404);
  }

  const [pendingMember] = room.pendingMembers.splice(
    pendingMemberIndex,
    1,
  );

  room.members.push({
    user: pendingMember.user,
  });

  await room.save({ validateModifiedOnly: true });

  return {
    room,
    message: 'Member approved successfully.',
  };
};

const rejectMember = async ({ currentUserId, roomId, userId }) => {
  validateObjectId(currentUserId, 'current user id');
  validateObjectId(userId, 'user id');

  const room = await findRoomById(roomId);

  ensureAdmin(room, currentUserId);

  const pendingMemberIndex = room.pendingMembers.findIndex(
    (pendingMember) => getUserId(pendingMember.user) === userId.toString(),
  );

  if (pendingMemberIndex === -1) {
    throw new AppError('Pending member not found.', 404);
  }

  room.pendingMembers.splice(pendingMemberIndex, 1);

  await room.save({ validateModifiedOnly: true });

  return {
    message: 'Join request rejected successfully.',
  };
};

const removeMember = async ({ currentUserId, roomId, userId }) => {
  validateObjectId(currentUserId, 'current user id');
  validateObjectId(userId, 'user id');

  const room = await findRoomById(roomId);

  const isSelfRemoval = currentUserId.toString() === userId.toString();
  const isOwner = room.createdBy.equals(currentUserId);

  if (!isOwner && !isSelfRemoval) {
    throw new AppError(
      'You are not authorized to remove this member.',
      403,
    );
  }

  if (room.createdBy.equals(userId)) {
    if (!isSelfRemoval) {
      throw new AppError(
        'Room owner cannot be removed from ownership.',
        400,
      );
    }

    room.members = room.members.filter(
      (member) => getUserId(member.user) !== userId.toString(),
    );

    await room.save({ validateModifiedOnly: true });

    return {
      room,
      message:
        'Room owner remains the owner and is not listed as a member.',
    };
  }

  const targetMember = findMember(room, userId);

  if (!targetMember) {
    throw new AppError('Room member not found.', 404);
  }

  room.members = room.members.filter(
    (member) => getUserId(member.user) !== userId.toString(),
  );

  await room.save({ validateModifiedOnly: true });

  return {
    room,
    message: 'Member removed successfully.',
  };
};

const getMembers = async ({ currentUserId, roomId }) => {
  validateObjectId(currentUserId, 'current user id');

  const room = await findRoomById(
    roomId,
    Room.findById(roomId)
      .populate('createdBy', 'name email image')
      .populate('members.user', 'name email image'),
  );

  ensureMember(room, currentUserId);

  return {
    owner: room.createdBy,
    members: room.members,
  };
};

const getPending = async ({ currentUserId, roomId }) => {
  validateObjectId(currentUserId, 'current user id');

  const room = await findRoomById(
    roomId,
    Room.findById(roomId).populate(
      'pendingMembers.user',
      'name email image',
    ),
  );

  ensureAdmin(room, currentUserId);

  return {
    pendingMembers: room.pendingMembers,
  };
};

export {
  joinRoom,
  approveMember,
  rejectMember,
  removeMember,
  getMembers,
  getPending,
};
