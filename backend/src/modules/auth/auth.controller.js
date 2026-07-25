import User from '../user/user.model.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';
import * as authService from './auth.service.js';

const OTP_PURPOSES = ['Email Confirmation', 'Password Recovery'];

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

  let otpSent = true;
  try {
    await authService.sendOtpEmail(user, 'Email Confirmation');
  } catch (err) {
    otpSent = false;
  }

  authService.createSendToken(
    user,
    201,
    res,
    otpSent
      ? 'Your account was created successfully! Please check your email for the verification code.'
      : 'Your account was created, but we could not send the verification email. Please request a new code.',
  );
});

const sendOtp = catchAsync(async (req, res, next) => {
  const { purpose } = req.params;
  const { email } = req.body;
  const responseMessage =
    'If an account exists for this email, an OTP has been sent.';

  if (!OTP_PURPOSES.includes(purpose)) {
    return next(new AppError('Invalid OTP purpose.', 400));
  }

  if (!email) {
    return next(new AppError('Email is required.', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    if (purpose === 'Password Recovery') {
      return res.status(200).json({ status: 'success', message: responseMessage });
    }
    return next(new AppError('No account found for this email.', 404));
  }

  if (purpose === 'Email Confirmation' && user.isVerified) {
    return next(new AppError('Your account is already verified.', 400));
  }

  await authService.sendOtpEmail(user, purpose);

  res.status(200).json({ status: 'success', message: responseMessage });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }
  authService.createSendToken(user, 200, res, 'Logged in successfully!');
});

// Handles verification for both purposes, working purely off {email, otp}
// so it never depends on the caller already having a session cookie.
const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  const { purpose } = req.params;

  if (!OTP_PURPOSES.includes(purpose)) {
    return next(new AppError('Invalid OTP purpose.', 400));
  }

  if (purpose === 'Email Confirmation') {
    const user = await authService.verifyOtp(email, otp, purpose);
    user.isVerified = true;
    user.clearOtp();
    await user.save({ validateBeforeSave: false });

    return authService.createSendToken(
      user,
      200,
      res,
      'Email confirmed successfully!',
    );
  }

  // Password Recovery: consume the original OTP and hand back a fresh,
  // short-lived reset token for the next step instead.
  const { resetToken } = await authService.issueResetToken(email, otp);

  res.status(200).json({
    status: 'success',
    message: 'OTP verified successfully',
    resetToken,
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { email, resetToken, password } = req.body;
  const user = await authService.verifyOtp(
    email,
    resetToken,
    'Password Recovery',
  );
  user.clearOtp();
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
  if (await user.correctPassword(password)) {
    return next(new AppError('New password must be different', 400));
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
    secure: process.env.NODE_ENV !== 'development',
    sameSite: process.env.NODE_ENV !== 'development' ? 'None' : 'Lax',
  });
  res.status(200).json({
    status: 'success',
  });
};

export {
  register,
  sendOtp,
  login,
  verifyOtp,
  resetPassword,
  updateMyPassword,
  logout,
};
