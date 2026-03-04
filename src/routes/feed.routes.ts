import { Router } from 'express';
import { FeedController } from '../controllers/feed.controller';

export const feedRouter = Router();
const controller = new FeedController();

feedRouter.get('/', controller.getFeed.bind(controller));
