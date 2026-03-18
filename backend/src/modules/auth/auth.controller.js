import User from '../user/user.model.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';
import * as authService from './auth.service.js';

const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(
      new AppError(
        'An account with this email already exists. Please login instead.',
        409,
      ),
    );
  }
  const user = await User.create({
    name,
    email,
    password,
  });
  authService.createSendToken(
    user,
    201,
    res,
    'Your account created successfully!',
  );
});

const sendOtp = catchAsync(async (req, res, next) => {
  const { purpose } = req.params;
  const responseMessage = 'If an OTP was sent, please check your email.';

  const otpConfigs = {
    'Email Confirmation': {
      requireAuth: true,
      findUser: async () => await User.findById(req.user._id),
      condition: (user) => user.isVerified,
      errorMsg: 'Your account is already verified.',
      sendToken: true,
    },
    'Password Recovery': {
      requireAuth: false,
      findUser: async () => await User.findOne({ email: req.body.email }),
      condition: (user) => !user,
      errorMsg: null,
      sendToken: false,
    },
  };

  const config = otpConfigs[purpose];
  if (!config) return next(new AppError('Invalid OTP purpose.', 400));

  const user = await config.findUser();

  if (config.condition(user)) {
    if (purpose === 'Password Recovery') {
      return res.status(200).json({
        status: 'success',
        message: responseMessage,
      });
    }
    return next(new AppError(config.errorMsg, 400));
  }

  await authService.sendOtpEmail(user, purpose);
  const responseBody = {
    status: 'success',
    message: responseMessage,
  };

  if (config.sendToken) {
    return authService.createSendToken(user, 200, res, responseMessage);
  }

  res.status(200).json(responseBody);
});

const verifyEmail = catchAsync(async (req, res, next) => {
  const { email } = req.user;
  const { otp } = req.body;
  const user = await authService.verifyOtp(
    email,
    otp,
    'Email Confirmation',
  );

  user.isVerified = true;
  user.otp = {};
  await user.save({ validateBeforeSave: false });

  authService.createSendToken(
    user,
    200,
    res,
    'Email confirmed successfully!',
  );
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }
  authService.createSendToken(user, 200, res, 'Logged in successfully!');
});

const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  const { purpose } = req.params;
  await authService.verifyOtp(email, otp, purpose);
  res.status(200).json({
    status: 'success',
    message: 'OTP verified successfully',
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await authService.verifyOtp(
    email,
    otp,
    'Password Recovery',
  );
  user.otp = {};
  const { password } = req.body;
  user.password = password;
  if (!user.isVerified) user.isVerified = true;
  await user.save();
  authService.createSendToken(
    user,
    200,
    res,
    'Password reset successfully',
  );
});

const updateMyPassword = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const { currentPassword, password } = req.body;
  const user = await User.findById(_id).select('+password');
  if (!(await user.correctPassword(currentPassword))) {
    return next(new AppError('Your current password is wrong!', 400));
  }
  user.password = password;
  await user.save({ validateModifiedOnly: true });

  authService.createSendToken(
    user,
    200,
    res,
    'Password updated successfully',
  );
});

const logout = (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  });
  res.status(200).json({
    status: 'success',
  });
};

export {
  register,
  sendOtp,
  verifyEmail,
  login,
  verifyOtp,
  resetPassword,
  updateMyPassword,
  logout,
};
