import * as roomMembersService from './roomMembers.service.js';
import catchAsync from '../../utils/error/catchAsync.js';

const joinRoom = catchAsync(async (req, res) => {
  const result = await roomMembersService.joinRoom({
    userId: req.user._id,
    roomId: req.params.id,
    password: req.body?.password,
  });

  res.status(200).json({
    status: 'success',
    message: result.message,
    data: {
      room: result.room,
    },
  });
});

const approveMember = catchAsync(async (req, res) => {
  const result = await roomMembersService.approveMember({
    currentUserId: req.user._id,
    roomId: req.params.id,
    userId: req.params.userId,
  });

  res.status(200).json({
    status: 'success',
    message: result.message,
    data: {
      room: result.room,
    },
  });
});

const rejectMember = catchAsync(async (req, res) => {
  const result = await roomMembersService.rejectMember({
    currentUserId: req.user._id,
    roomId: req.params.id,
    userId: req.params.userId,
  });

  res.status(200).json({
    status: 'success',
    message: result.message,
    data: {
      room: result.room,
    },
  });
});

const removeMember = catchAsync(async (req, res) => {
  const result = await roomMembersService.removeMember({
    currentUserId: req.user._id,
    roomId: req.params.id,
    userId: req.params.userId,
  });

  res.status(200).json({
    status: 'success',
    message: result.message,
    data: {
      room: result.room,
    },
  });
});

const getMembers = catchAsync(async (req, res) => {
  const result = await roomMembersService.getMembers({
    currentUserId: req.user._id,
    roomId: req.params.id,
  });

  res.status(200).json({
    status: 'success',
    results: result.members.length,
    data: {
      owner: result.owner,
      members: result.members,
    },
  });
});

const getPending = catchAsync(async (req, res) => {
  const result = await roomMembersService.getPending({
    currentUserId: req.user._id,
    roomId: req.params.id,
  });

  res.status(200).json({
    status: 'success',
    results: result.pendingMembers.length,
    data: {
      pendingMembers: result.pendingMembers,
    },
  });
});

export {
  joinRoom,
  approveMember,
  rejectMember,
  removeMember,
  getMembers,
  getPending,
};
