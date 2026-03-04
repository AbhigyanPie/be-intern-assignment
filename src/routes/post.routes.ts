import { Router } from 'express';
import { validate } from '../middleware/validation.middleware';
import { createPostSchema, updatePostSchema } from '../validations/post.validation';
import { PostController } from '../controllers/post.controller';

export const postRouter = Router();
const controller = new PostController();

postRouter.get('/', controller.getAllPosts.bind(controller));
postRouter.get('/hashtag/:tag', controller.getPostsByHashtag.bind(controller));
postRouter.get('/:id', controller.getPostById.bind(controller));
postRouter.post('/', validate(createPostSchema), controller.createPost.bind(controller));
postRouter.put('/:id', validate(updatePostSchema), controller.updatePost.bind(controller));
postRouter.delete('/:id', controller.deletePost.bind(controller));
