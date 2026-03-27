import Joi from "joi";
import mongoose from "mongoose";

export const taskValidation = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      "string.empty": "Title is required",
      "string.min": "Title must be at least 1 character",
      "string.max": "Title must be at most 255 characters",
    }),

  room: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("Room must be a valid ObjectId");
      }
      return value;
    }),

  createdBy: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("CreatedBy must be a valid ObjectId");
      }
      return value;
    }),

  doneBy: Joi.array().items(
    Joi.object({
      user: Joi.string()
        .required()
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.message("DoneBy.user must be a valid ObjectId");
          }
          return value;
        }),
      completedAt: Joi.date().optional(),
    })
  ).messages({
    "array.base": "DoneBy must be an array",
  }),
});