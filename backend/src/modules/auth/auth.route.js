import express from 'express';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import * as authValidation from './auth.validation.js';
import validation from '../../middlewares/validation.middleware.js';
import * as authController from './auth.controller.js';
import checkOtpPurpose from '../../middlewares/checkOtpPurpose.js';

const authRouter = express.Router();

authRouter.post(
  '/register',
  validation(authValidation.registerSchema),
  authController.register,
);
authRouter.post(
  '/send-otp/:purpose',
  checkOtpPurpose,
  authController.sendOtp,
);
authRouter.patch(
  '/verify-email',
  authMiddleware.isAuthenticated,
  authController.verifyEmail,
);
authRouter.post(
  '/login',
  validation(authValidation.loginSchema),
  authController.login,
);
authRouter.post('/verify-otp/:purpose', authController.verifyOtp);
authRouter.patch(
  '/reset-password',
  validation(authValidation.resetPasswordSchema),
  authController.resetPassword,
);

authRouter.post('/logout', authController.logout);

export default authRouter;
