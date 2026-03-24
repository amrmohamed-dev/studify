import catchAsync from '../../utils/error/catchAsync.js';
import createNotification from '../../utils/notification.util.js';
import * as friendshipService from './friendship.service.js';

const sendFriendRequest = catchAsync(async (req, res) => {
  const friendship = await friendshipService.sendFriendRequest(
    req.user._id,
    req.body.recipientId,
  );

  await createNotification({
    recipient: friendship.recipient._id,
    sender: req.user._id,
    type: 'friend_request',
    message: `${req.user.name} sent you a friend request.`,
    link: '/friends?tab=requests',
    metadata: {
      friendshipId: friendship._id.toString(),
    },
  });

  res.status(201).json({
    status: 'success',
    message: 'Friend request sent successfully.',
    data: {
      friendship,
    },
  });
});

const acceptFriendRequest = catchAsync(async (req, res) => {
  const friendship = await friendshipService.acceptFriendRequest(
    req.params.id,
    req.user._id,
  );

  await createNotification({
    recipient: friendship.requester._id,
    sender: req.user._id,
    type: 'friend_accepted',
    message: `${req.user.name} accepted your friend request.`,
    link: '/friends?tab=friends',
    metadata: {
      friendshipId: friendship._id.toString(),
    },
  });

  res.status(200).json({
    status: 'success',
    message: 'Friend request accepted successfully.',
    data: {
      friendship,
    },
  });
});

const rejectFriendRequest = catchAsync(async (req, res) => {
  await friendshipService.rejectFriendRequest(req.params.id, req.user._id);

  res.status(200).json({
    status: 'success',
    message: 'Friend request rejected successfully.',
  });
});

const getFriends = catchAsync(async (req, res) => {
  const { friends, meta } = await friendshipService.getFriends(
    req.user._id,
    req.query,
  );

  res.status(200).json({
    status: 'success',
    meta,
    data: {
      friends,
    },
  });
});

const getPendingRequests = catchAsync(async (req, res) => {
  const requests = await friendshipService.getPendingRequests(
    req.user._id,
  );

  res.status(200).json({
    status: 'success',
    results: requests.length,
    data: {
      requests,
    },
  });
});

export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
};
