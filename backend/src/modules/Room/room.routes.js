import express from "express";
import * as roomController from "./room.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

import {
  joinRoomSchema,
  approveMemberSchema,
  removeMemberSchema,
  getMembersSchema,
  getPendingSchema
} from "./room.validation.js";

const router = express.Router();

router.post(
  "/:id/join",
  protect,
  validate(joinRoomSchema),
  roomController.joinRoom
);

router.patch(
  "/:id/members/:userId/approve",
  protect,
  validate(approveMemberSchema),
  roomController.approveMember
);

router.delete(
  "/:id/members/:userId",
  protect,
  validate(removeMemberSchema),
  roomController.removeMember
);

router.get(
  "/:id/members",
  protect,
  validate(getMembersSchema),
  roomController.getMembers
);

router.get(
  "/:id/pending",
  protect,
  validate(getPendingSchema),
  roomController.getPending
);

export default router;