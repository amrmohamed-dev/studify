import express from "express";
import * as taskController from "./task.controller.js";
import * as authMiddleware from "../../middlewares/auth.middleware.js";
import validation from "../../middlewares/validation.middleware.js";
import { taskValidation } from "./task.validation.js";

const taskRouter = express.Router();

taskRouter.use(authMiddleware.isAuthenticated,authMiddleware.needVerify);

taskRouter
  .route("/tasks")
  .post(
    validation(taskValidation), 
    taskController.createTask
  )
  .get(taskController.getRoomTasks);

taskRouter
  .route("/tasks/:id")
  .get(taskController.getTaskById)
  .patch(
    validation(taskValidation), 
    taskController.updateTask
  )
  .delete(taskController.deleteTask);

taskRouter.patch("/tasks/:id/toggle", taskController.toggleTask);

export default taskRouter;