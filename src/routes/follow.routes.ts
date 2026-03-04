import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { createFollowSchema } from '../validations/follow.validation';
import { FollowController } from '../controllers/follow.controller';

export const followRouter = Router();
const controller = new FollowController();

followRouter.get('/', controller.getAllFollows.bind(controller));
followRouter.get('/:id', controller.getFollowById.bind(controller));
followRouter.post('/', validate(createFollowSchema), controller.createFollow.bind(controller));
followRouter.delete('/:id', controller.deleteFollow.bind(controller));
