import { Request, Response } from 'express';
import { Post } from '../entities/Post';
import { Follow } from '../entities/Follow';
import { Like } from '../entities/Like';
import { AppDataSource } from '../data-source';

export class FeedController {
  private postRepo = AppDataSource.getRepository(Post);
  private followRepo = AppDataSource.getRepository(Follow);
  private likeRepo = AppDataSource.getRepository(Like);

  // returns posts from people the user follows
  async getFeed(req: Request, res: Response) {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      // first find who this user follows
      const follows = await this.followRepo.find({
        where: { followerId: userId },
      });
      const followingIds = follows.map(f => f.followingId);

      if (followingIds.length === 0) {
        return res.json([]); // not following anyone
      }

      // then get posts from those users
      const posts = await this.postRepo
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .leftJoinAndSelect('post.hashtags', 'hashtags')
        .leftJoinAndSelect('post.likes', 'likes')
        .where('post.userId IN (:...ids)', { ids: followingIds })
        .orderBy('post.createdAt', 'DESC')
        .getMany();

      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching feed', error });
    }
  }

  // shows recent activity for a user (posts they made, likes they gave, people they followed)
  async getUserActivity(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);

      // get their posts
      const posts = await this.postRepo.find({
        where: { userId },
        relations: ['hashtags'],
        order: { createdAt: 'DESC' },
      });

      // get their likes
      const likes = await this.likeRepo.find({
        where: { userId },
        relations: ['post', 'post.user'],
        order: { createdAt: 'DESC' },
      });

      // get who they followed
      const follows = await this.followRepo.find({
        where: { followerId: userId },
        relations: ['following'],
        order: { createdAt: 'DESC' },
      });

      // combine everything into one list
      const activity: any[] = [];

      posts.forEach(p => {
        activity.push({
          type: 'post',
          timestamp: p.createdAt,
          data: { postId: p.id, content: p.content },
        });
      });

      likes.forEach(l => {
        activity.push({
          type: 'like',
          timestamp: l.createdAt,
          data: { postId: l.postId, postContent: l.post.content },
        });
      });

      follows.forEach(f => {
        activity.push({
          type: 'follow',
          timestamp: f.createdAt,
          data: {
            userId: f.followingId,
            userName: f.following.firstName + ' ' + f.following.lastName,
          },
        });
      });

      // sort newest first
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching activity', error });
    }
  }
}
