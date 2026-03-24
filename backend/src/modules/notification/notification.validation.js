import joi from 'joi';

const objectId = joi.string().hex().length(24);

const notificationIdSchema = joi.object({
  id: objectId.required().messages({
    'string.hex': 'Notification id must be a valid ObjectId.',
    'string.length': 'Notification id must be a valid ObjectId.',
    'string.empty': 'Notification id is required.',
    'any.required': 'Notification id is required.',
  }),
});

const getNotificationsSchema = joi.object({
  search: joi.string().trim().allow(''),
  page: joi.number().integer().min(1),
  limit: joi.number().integer().min(1).max(100),
  sort: joi.string(),
  fields: joi.string(),
  isRead: joi.boolean(),
  type: joi
    .string()
    .valid(
      'friend_request',
      'friend_accepted',
      'room_approved',
      'task_assigned',
      'task_completed',
      'session_started',
      'session_finished',
    ),
});

export { notificationIdSchema, getNotificationsSchema };
