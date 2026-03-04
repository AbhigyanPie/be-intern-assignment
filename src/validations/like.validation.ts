import Joi from 'joi';

export const createLikeSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  postId: Joi.number().integer().positive().required(),
});
