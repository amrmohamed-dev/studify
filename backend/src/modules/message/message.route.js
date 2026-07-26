import express from "express";
import * as messageController from "./message.controller.js";
import * as authMiddleware from "../../middlewares/auth.middleware.js";
import { ensureRoomMember } from "../../middlewares/roomAccess.middleware.js";

const messageRouter = express.Router();

messageRouter.use(
  authMiddleware.isAuthenticated,
  authMiddleware.needVerify
);

messageRouter.get(
  "/rooms/:roomId/messages",
  ensureRoomMember,
  messageController.getMessagesByRoomId
);

export default messageRouter;