import { Request, Response } from 'express';
import { Like } from '../entities/Like';
import { Post } from '../entities/Post';
import { AppDataSource } from '../data-source';

export class LikeController {
  private likeRepo = AppDataSource.getRepository(Like);
  private postRepo = AppDataSource.getRepository(Post);

  async getAllLikes(req: Request, res: Response) {
    try {
      const likes = await this.likeRepo.find({ relations: ['user', 'post'] });
      res.json(likes);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching likes', error });
    }
  }

  async getLikeById(req: Request, res: Response) {
    try {
      const like = await this.likeRepo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ['user', 'post'],
      });
      if (!like) return res.status(404).json({ message: 'Like not found' });
      res.json(like);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching like', error });
    }
  }

  async createLike(req: Request, res: Response) {
    try {
      const { userId, postId } = req.body;

      // make sure post exists first
      const post = await this.postRepo.findOneBy({ id: postId });
      if (!post) return res.status(404).json({ message: 'Post not found' });

      // dont let them like twice
      const already = await this.likeRepo.findOneBy({ userId, postId });
      if (already) return res.status(409).json({ message: 'Already liked this post' });

      const like = this.likeRepo.create({ userId, postId });
      const result = await this.likeRepo.save(like);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error creating like', error });
    }
  }

  async deleteLike(req: Request, res: Response) {
    try {
      const result = await this.likeRepo.delete(parseInt(req.params.id));
      if (result.affected === 0) return res.status(404).json({ message: 'Like not found' });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting like', error });
    }
  }
}
