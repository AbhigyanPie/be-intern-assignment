import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { createLikeSchema } from '../validations/like.validation';
import { LikeController } from '../controllers/like.controller';

export const likeRouter = Router();
const controller = new LikeController();

likeRouter.get('/', controller.getAllLikes.bind(controller));
likeRouter.get('/:id', controller.getLikeById.bind(controller));
likeRouter.post('/', validate(createLikeSchema), controller.createLike.bind(controller));
likeRouter.delete('/:id', controller.deleteLike.bind(controller));
