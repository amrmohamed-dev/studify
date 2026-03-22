import express from 'express';
import * as roomController from './room.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import validation from '../../middlewares/validation.middleware.js';
import { createRoomSchema, updateRoomSchema } from './room.validation.js';

const roomRouter = express.Router();

roomRouter.use(authMiddleware.isAuthenticated);

roomRouter
  .route('/')
  .post(validation(createRoomSchema), roomController.createRoom)
  .get(roomController.getAllRooms);

roomRouter
  .route('/:id')
  .get(roomController.getRoom)
  .patch(validation(updateRoomSchema), roomController.updateRoom)
  .delete(roomController.deleteRoom);

export default roomRouter;