const areSameUsers = (firstUserId, secondUserId) =>
  firstUserId.toString() === secondUserId.toString();

const getOtherUser = (friendship, currentUserId) => {
  if (areSameUsers(friendship.requester._id, currentUserId)) {
    return friendship.recipient;
  }

  return friendship.requester;
};

const normalizeFriendship = (friendship, currentUserId) => ({
  _id: friendship._id,
  status: friendship.status,
  createdAt: friendship.createdAt,
  updatedAt: friendship.updatedAt,
  friend: getOtherUser(friendship, currentUserId),
});

const normalizePendingRequest = (friendship) => ({
  _id: friendship._id,
  status: friendship.status,
  createdAt: friendship.createdAt,
  updatedAt: friendship.updatedAt,
  requester: friendship.requester,
  recipient: friendship.recipient,
});

export { getOtherUser, normalizeFriendship, normalizePendingRequest };
