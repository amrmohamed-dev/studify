import express from 'express';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import validation from '../../middlewares/validation.middleware.js';
import * as notificationController from './notification.controller.js';
import {
  getNotificationsSchema,
  notificationIdSchema,
} from './notification.validation.js';

const notificationRouter = express.Router();

notificationRouter.use(authMiddleware.isAuthenticated);

notificationRouter.get(
  '/',
  validation(getNotificationsSchema),
  notificationController.getNotifications,
);

notificationRouter.patch(
  '/read-all',
  notificationController.markAllNotificationsAsRead,
);

notificationRouter.patch(
  '/:id/read',
  validation(notificationIdSchema),
  notificationController.markNotificationAsRead,
);

export default notificationRouter;
