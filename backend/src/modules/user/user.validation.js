import joi from 'joi';

const updatePasswordSchema = joi.object({
  currentPassword: joi
    .string()
    .pattern(/^[a-zA-Z0-9]{8,30}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Current password must be 8-30 characters and contain only letters and numbers.',
      'string.empty': 'Current password is required.',
      'any.required': 'Current password is required.',
    }),

  password: joi
    .string()
    .pattern(/^[a-zA-Z0-9]{8,30}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must be 8-30 characters and contain only letters and numbers.',
      'string.empty': 'Password is required.',
      'any.required': 'Password is required.',
    }),

  passwordConfirm: joi
    .string()
    .valid(joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match.',
      'string.empty': 'Password confirmation is required.',
      'any.required': 'Password confirmation is required.',
    }),
});

export { updatePasswordSchema };
