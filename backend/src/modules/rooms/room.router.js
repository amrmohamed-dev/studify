import { Router } from 'express';
import * as roomController from './room.controller.js';
import validate from '../../middlewares/validate.js';
import { createRoomSchema, updateRoomSchema } from './room.validation.js';

const router = Router();

router.post('/', validate(createRoomSchema), roomController.createRoom);
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoom);
router.patch('/:id', validate(updateRoomSchema), roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

export default router;