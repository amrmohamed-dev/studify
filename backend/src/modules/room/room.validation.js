import Joi from 'joi';

const createRoomSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),

  privacyType: Joi.string()
    .valid('public', 'private_request', 'private_password')
    .default('public'),

  password: Joi.when('privacyType', {
    is: 'private_password',
    then: Joi.string().min(6).required(),
    otherwise: Joi.forbidden(),
  }),

  maxMembers: Joi.number().min(1).max(11),
});

const updateRoomSchema = Joi.object({
  name: Joi.string().min(3).max(50),

  privacyType: Joi.string().valid(
    'public',
    'private_request',
    'private_password',
  ),

  password: Joi.string().min(6),

  maxMembers: Joi.number().min(1).max(11),
});

export { createRoomSchema, updateRoomSchema };
