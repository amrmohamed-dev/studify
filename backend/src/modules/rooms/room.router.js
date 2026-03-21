import { Router } from 'express';
import * as roomController from './room.controller.js';
import validate from '../../middlewares/validate.js';
import { createRoomSchema, updateRoomSchema } from './room.validation.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(isAuthenticated);

router.post('/', validate(createRoomSchema), roomController.createRoom);
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoom);
router.patch('/:id', validate(updateRoomSchema), roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

export default router;