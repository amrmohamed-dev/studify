import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const joinRoomSchema = Joi.object({
  params: Joi.object({
    id: objectId.required()
  })
});

export const approveMemberSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
    userId: objectId.required()
  })
});

export const removeMemberSchema = Joi.object({
  params: Joi.object({
    id: objectId.required(),
    userId: objectId.required()
  })
});

export const getMembersSchema = Joi.object({
  params: Joi.object({
    id: objectId.required()
  })
});

export const getPendingSchema = Joi.object({
  params: Joi.object({
    id: objectId.required()
  })
});