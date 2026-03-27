import express from 'express';
import * as roomMembersController from './roomMembers.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import validation from '../../middlewares/validation.middleware.js';
import * as roomMembersValidation from './roomMembers.validation.js';

const roomMembersRouter = express.Router({ mergeParams: true });

roomMembersRouter.use(
  authMiddleware.isAuthenticated,
  authMiddleware.needVerify,
);

roomMembersRouter.post(
  '/join',
  validation(roomMembersValidation.joinRoomSchema),
  roomMembersController.joinRoom,
);

roomMembersRouter.patch(
  '/members/:userId/approve',
  validation(roomMembersValidation.approveMemberSchema),
  roomMembersController.approveMember,
);

roomMembersRouter.patch(
  '/members/:userId/reject',
  validation(roomMembersValidation.rejectMemberSchema),
  roomMembersController.rejectMember,
);

roomMembersRouter.delete(
  '/members/:userId',
  validation(roomMembersValidation.removeMemberSchema),
  roomMembersController.removeMember,
);

roomMembersRouter.get(
  '/members',
  validation(roomMembersValidation.getMembersSchema),
  roomMembersController.getMembers,
);

roomMembersRouter.get(
  '/pending',
  validation(roomMembersValidation.getPendingSchema),
  roomMembersController.getPending,
);

export default roomMembersRouter;
