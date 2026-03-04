import Joi from 'joi';

export const createFollowSchema = Joi.object({
  followerId: Joi.number().integer().positive().required(),
  followingId: Joi.number().integer().positive().required(),
});
