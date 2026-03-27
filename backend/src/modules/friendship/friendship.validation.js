import joi from 'joi';

const objectId = joi.string().hex().length(24);

const sendFriendRequestSchema = joi.object({
  recipientId: objectId.required().messages({
    'string.hex': 'Recipient id must be a valid ObjectId.',
    'string.length': 'Recipient id must be a valid ObjectId.',
    'string.empty': 'Recipient id is required.',
    'any.required': 'Recipient id is required.',
  }),
});

const friendshipIdSchema = joi.object({
  id: objectId.required().messages({
    'string.hex': 'Friendship id must be a valid ObjectId.',
    'string.length': 'Friendship id must be a valid ObjectId.',
    'string.empty': 'Friendship id is required.',
    'any.required': 'Friendship id is required.',
  }),
});

const listFriendsSchema = joi.object({
  search: joi.string().trim().allow(''),
  page: joi.number().integer().min(1),
  limit: joi.number().integer().min(1).max(100),
});

export { sendFriendRequestSchema, friendshipIdSchema, listFriendsSchema };
