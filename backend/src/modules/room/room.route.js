import { Router } from 'express';
import * as roomController from './room.controller.js';
import validate from '../../middlewares/validation.middleware.js';
import { createRoomSchema, updateRoomSchema } from './room.validation.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(isAuthenticated);

router
  .route('/')
  .post(validate(createRoomSchema), roomController.createRoom)
  .get(roomController.getAllRooms);

router
  .route('/:id')
  .get(roomController.getRoom)
  .patch(validate(updateRoomSchema), roomController.updateRoom)
  .delete(roomController.deleteRoom);

export default router;
