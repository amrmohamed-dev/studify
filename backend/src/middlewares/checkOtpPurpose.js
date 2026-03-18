import { isAuthenticated } from './auth.middleware.js';

const checkOtpPurpose = (req, res, next) => {
  const { purpose } = req.params;
  if (purpose === 'Email Confirmation') {
    return isAuthenticated(req, res, next);
  }
  next();
};

export default checkOtpPurpose;
