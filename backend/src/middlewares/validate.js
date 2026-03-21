import AppError from '../utils/error/appError.js';

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const message = error.details.map((el) => el.message).join(', ');
    return next(new AppError(message, 400));
  }
  
  next();
};

export default validate;