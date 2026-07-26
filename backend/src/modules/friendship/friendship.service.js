import Friendship, { buildPairKey } from './friendship.model.js';
import APIFeatures from '../../utils/apiFeatures.js';
import AppError from '../../utils/error/appError.js';
import validateObjectId from '../../utils/validateObjectId.js';
import {
  normalizeFriendship,
  normalizePendingRequest,
} from './friendship.utils.js';
import {
  emitFriendAccepted,
  emitFriendRequest,
} from './friendship.socket.js';

const FRIEND_POPULATION = [
  {
    path: 'requester',
    select: 'name email image',
  },
  {
    path: 'recipient',
    select: 'name email image',
  },
];

const sendFriendRequest = async (requesterId, recipientId) => {
  validateObjectId(requesterId, 'requester id');
  validateObjectId(recipientId, 'recipient id');

  if (requesterId.toString() === recipientId.toString()) {
    throw new AppError(
      'You cannot send a friend request to yourself.',
      400,
    );
  }

  const existingFriendship = await Friendship.findOne({
    pairKey: buildPairKey(requesterId, recipientId),
  });

  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      throw new AppError('You are already friends.', 409);
    }
    if (existingFriendship.status === 'pending') {
      throw new AppError('A friend request is already pending.', 409);
    }
  }

  const friendship = await Friendship.create({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending',
  });

  const populatedFriendship = await Friendship.findById(
    friendship._id,
  ).populate(FRIEND_POPULATION);

  emitFriendRequest(recipientId, {
    friendship: normalizePendingRequest(populatedFriendship),
  });

  return populatedFriendship;
};

const acceptFriendRequest = async (friendshipId, currentUserId) => {
  validateObjectId(friendshipId, 'friendship id');

  const friendship = await Friendship.findById(friendshipId);

  if (!friendship) {
    throw new AppError('Friend request not found.', 404);
  }

  if (friendship.recipient.toString() !== currentUserId.toString()) {
    throw new AppError(
      'You are not authorized to accept this friend request.',
      403,
    );
  }

  if (friendship.status !== 'pending') {
    throw new AppError(
      'Only pending friend requests can be accepted.',
      400,
    );
  }

  friendship.status = 'accepted';
  await friendship.save();

  const populatedFriendship = await Friendship.findById(
    friendship._id,
  ).populate(FRIEND_POPULATION);

  emitFriendAccepted(populatedFriendship.requester._id, {
    friendship: normalizeFriendship(
      populatedFriendship,
      populatedFriendship.requester._id,
    ),
  });

  return populatedFriendship;
};

const rejectFriendRequest = async (friendshipId, currentUserId) => {
  validateObjectId(friendshipId, 'friendship id');

  const friendship = await Friendship.findById(friendshipId);

  if (!friendship) {
    throw new AppError('Friend request not found.', 404);
  }

  if (friendship.recipient.toString() !== currentUserId.toString()) {
    throw new AppError(
      'You are not authorized to reject this friend request.',
      403,
    );
  }

  if (friendship.status !== 'pending') {
    throw new AppError(
      'Only pending friend requests can be rejected.',
      400,
    );
  }

  await friendship.deleteOne();
};

const getFriends = async (currentUserId, query) => {
  validateObjectId(currentUserId, 'user id');

  const match = {
    status: 'accepted',
    $or: [{ requester: currentUserId }, { recipient: currentUserId }],
  };

  const features = new APIFeatures(
  Friendship.find(match).populate(FRIEND_POPULATION),
  query,
)
  .filter([])
  .search([...
      'requester.name',
      'recipient.name',
      'requester.email',
      'recipient.email',
    ])
    .sort()
    .select()
    .paginate();

  const friendships = await features.mongooseQuery;
  const total = await Friendship.countDocuments(match);

  const totalPages = Math.ceil(total / features.limit);

  return {
    friends: friendships.map((friendship) =>
      normalizeFriendship(friendship, currentUserId),
    ),
    meta: {
      total,
      results: friendships.length,
      totalPages,
      page: features.page,
      hasNext: features.page < totalPages,
      hasPrev: features.page > 1,
    },
  };
};

const getPendingRequests = async (currentUserId) => {
  validateObjectId(currentUserId, 'user id');

  const requests = await Friendship.find({
    recipient: currentUserId,
    status: 'pending',
  })
    .populate(FRIEND_POPULATION)
    .sort('-createdAt');

  return requests.map(normalizePendingRequest);
};

export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
};
