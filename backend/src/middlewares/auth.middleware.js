import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import User from '../modules/user/user.model.js';
import AppError from '../utils/error/appError.js';
import catchAsync from '../utils/error/catchAsync.js';

const isAuthenticated = catchAsync(async (req, res, next) => {
  const token = req.cookies?.jwt;
  if (!token) {
    return next(
      new AppError('Authentication required. Please log in.', 401),
    );
  }
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );
  const user = await User.findById(decoded.userId);
  if (!user || user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Authentication failed. Please log in again.', 401),
    );
  }
  req.user = user;
  next();
});

const needVerify = (req, res, next) => {
  if (!req.user.isVerified) {
    return next(new AppError('Please verify your email first', 403));
  }
  next();
};

const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action.',
          403,
        ),
      );
    }
    next();
  };

export { isAuthenticated, needVerify, restrictTo };
