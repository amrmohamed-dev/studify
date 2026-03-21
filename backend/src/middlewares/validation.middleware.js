import AppError from '../utils/error/appError.js';

const validation = (schema) => (req, res, next) => {
  const inputs = { ...req.params, ...req.query, ...req.body };
  const { error } = schema.validate(inputs, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const errors = error.details.map((err) => err.message);
    return next(new AppError(errors, 400));
  }
  next();
};

export default validation;
