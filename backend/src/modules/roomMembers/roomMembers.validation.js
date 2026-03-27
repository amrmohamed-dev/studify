import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

const roomIdSchema = {
  id: objectId.required(),
};

const roomUserSchema = {
  ...roomIdSchema,
  userId: objectId.required(),
};

const joinRoomSchema = Joi.object({
  ...roomIdSchema,
  password: Joi.string().min(6).allow(null, ''),
});

const approveMemberSchema = Joi.object(roomUserSchema);

const rejectMemberSchema = Joi.object(roomUserSchema);

const removeMemberSchema = Joi.object(roomUserSchema);

const getMembersSchema = Joi.object(roomIdSchema);

const getPendingSchema = Joi.object(roomIdSchema);

export {
  joinRoomSchema,
  approveMemberSchema,
  rejectMemberSchema,
  removeMemberSchema,
  getMembersSchema,
  getPendingSchema,
};
