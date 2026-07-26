import rateLimit from 'express-rate-limit';

// Generic login guard: 10 attempts / 15 min per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many login attempts. Please try again in a few minutes.',
  },
});

// OTP requests: 5 / 15 min per IP (sending emails should stay cheap).
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many OTP requests. Please try again in a few minutes.',
  },
});

// OTP verification: stricter, since it's a brute-forceable 6-digit code.
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many attempts. Please request a new OTP and try again later.',
  },
});
// Registration: 5 accounts / hour per IP (stops bulk/bot signups)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many accounts created from this IP. Please try again later.',
  },
});

export { loginLimiter, otpRequestLimiter, otpVerifyLimiter, registerLimiter };