import sendEmail from './email.service.js';
import AppError from '../../utils/error/appError.js';

const createSendEmail = async (options, user) => {
  try {
    await sendEmail(options);
    return true;
  } catch {
    user.set('otp.code', undefined);
    user.set('otp.expires', undefined);
    user.set('otp.purpose', undefined);
    await user.save({ validateBeforeSave: false });

    throw new AppError(
      'We could not send the email. Please try again later.',
      500,
    );
  }
};

export default createSendEmail;
