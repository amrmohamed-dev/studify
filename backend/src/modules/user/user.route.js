import express from 'express';
import * as userController from './user.controller.js';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import { updateMyPassword } from '../auth/auth.controller.js';
import validation from '../../middlewares/validation.middleware.js';
import { updatePasswordSchema } from './user.validation.js';
import fileUpload from '../../middlewares/upload.middleware.js';

const userRouter = express.Router();

userRouter.use(authMiddleware.isAuthenticated);

userRouter
  .route('/me')
  .get(userController.getMe)
  .patch(authMiddleware.needVerify, userController.updateMe)
  .delete(userController.deleteMe);

userRouter.patch(
  '/me/update-password',
  authMiddleware.needVerify,
  validation(updatePasswordSchema),
  updateMyPassword,
);

userRouter.get(
  '/me/favourites',
  authMiddleware.needVerify,
  userController.getMyFavourites,
);
userRouter.patch(
  '/me/favourites/:roomId',
  authMiddleware.needVerify,
  userController.toggleFavourite,
);

userRouter
  .route('/me/photo')
  .patch(
    authMiddleware.needVerify,
    fileUpload('image'),
    userController.addProfilePhoto,
  )
  .delete(authMiddleware.needVerify, userController.deleteProfilePhoto);

userRouter.route('/').get(userController.getAllUsers);

export default userRouter;
