import joi from 'joi';

const registerSchema = joi.object({
  name: joi.string().min(3).max(35).required().messages({
    'string.empty': 'Name is required.',
    'string.min': 'Name must be at least 3 characters.',
    'string.max': 'Name must not exceed 35 characters.',
    'any.required': 'Name is required.',
  }),

  email: joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
  }),

  password: joi
    .string()
    .pattern(/^\S{8,30}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must be 8-30 characters with no spaces.',
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

const loginSchema = joi.object({
  email: joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
  }),

  password: joi
    .string()
    .pattern(/^\S{8,30}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must be 8-30 characters with no spaces.',
      'string.empty': 'Password is required.',
      'any.required': 'Password is required.',
    }),
});

const resetPasswordSchema = joi.object({
  email: joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'string.empty': 'Email is required.',
    'any.required': 'Email is required.',
  }),

  resetToken: joi.string().required().messages({
    'string.empty': 'Reset token is required.',
    'any.required': 'Reset token is required.',
  }),

  password: joi
    .string()
    .pattern(/^\S{8,30}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must be 8-30 characters with no spaces.',
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

export { registerSchema, loginSchema, resetPasswordSchema };
