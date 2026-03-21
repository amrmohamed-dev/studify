import Joi from 'joi';

export const createRoomSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Room name is required',
    'any.required': 'Room name is required',
  }),
  description: Joi.string().trim().optional(),
  isPrivate: Joi.boolean().default(false),
  photo: Joi.string().optional(),
});

export const updateRoomSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().optional(),
  isPrivate: Joi.boolean().optional(),
  photo: Joi.string().optional(),
});