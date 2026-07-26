import express from "express";
import * as taskController from "./task.controller.js";
import * as authMiddleware from "../../middlewares/auth.middleware.js";
import { ensureRoomMember, ensureTaskRoomMember } from "../../middlewares/roomAccess.middleware.js";
import validation from "../../middlewares/validation.middleware.js";
import { taskValidation } from "./task.validation.js";

const taskRouter = express.Router();

taskRouter.use(authMiddleware.isAuthenticated,authMiddleware.needVerify);


taskRouter
  .route("/rooms/:roomId/tasks")
  .post(
    ensureRoomMember,
    validation(taskValidation),
    taskController.createTask
  )
  .get(ensureRoomMember, taskController.getRoomTasks);

taskRouter
  .route("/tasks/:id")
  .get(ensureTaskRoomMember, taskController.getTaskById)
  .patch(
    ensureTaskRoomMember,
    validation(taskValidation),
    taskController.updateTask
  )
  .delete(ensureTaskRoomMember, taskController.deleteTask);

taskRouter.patch("/tasks/:id/toggle", ensureTaskRoomMember, taskController.toggleTask);



export default taskRouter;