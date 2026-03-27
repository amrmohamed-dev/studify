import express from 'express';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import validation from '../../middlewares/validation.middleware.js';
import * as friendshipController from './friendship.controller.js';
import {
  friendshipIdSchema,
  listFriendsSchema,
  sendFriendRequestSchema,
} from './friendship.validation.js';

const friendshipRouter = express.Router();

friendshipRouter.use(authMiddleware.isAuthenticated);

friendshipRouter.post(
  '/request',
  validation(sendFriendRequestSchema),
  friendshipController.sendFriendRequest,
);

friendshipRouter.get('/requests', friendshipController.getPendingRequests);

friendshipRouter.get(
  '/',
  validation(listFriendsSchema),
  friendshipController.getFriends,
);

friendshipRouter.patch(
  '/:id/accept',
  validation(friendshipIdSchema),
  friendshipController.acceptFriendRequest,
);

friendshipRouter.patch(
  '/:id/reject',
  validation(friendshipIdSchema),
  friendshipController.rejectFriendRequest,
);

export default friendshipRouter;
