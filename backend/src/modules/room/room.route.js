import express from 'express';
import * as roomController from './room.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import validation from '../../middlewares/validation.middleware.js';
import { createRoomSchema, updateRoomSchema } from './room.validation.js';
import fileUpload from '../../middlewares/upload.middleware.js';
import roomMembersRouter from '../roomMembers/roomMembers.routes.js';

const roomRouter = express.Router();

roomRouter.use(authMiddleware.isAuthenticated, authMiddleware.needVerify);

roomRouter.use('/:id', roomMembersRouter);

roomRouter
  .route('/')
  .post(
    fileUpload('image'),
    validation(createRoomSchema),
    roomController.createRoom,
  )
  .get(roomController.getAllRooms);

roomRouter
  .route('/:id')
  .get(roomController.getOneRoom)
  .patch(
    fileUpload('image'),
    validation(updateRoomSchema),
    roomController.updateRoom,
  )
  .delete(roomController.deleteRoom);

export default roomRouter;
