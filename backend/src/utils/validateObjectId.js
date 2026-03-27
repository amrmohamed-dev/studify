import mongoose from 'mongoose';
import AppError from './error/appError.js';

const validateObjectId = (value, field = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${field}.`, 400);
  }
};

export default validateObjectId;
