import { Request, Response } from 'express';
import { Follow } from '../entities/Follow';
import { User } from '../entities/User';
import { AppDataSource } from '../data-source';

export class FollowController {
  private followRepo = AppDataSource.getRepository(Follow);
  private userRepo = AppDataSource.getRepository(User);

  async getAllFollows(req: Request, res: Response) {
    try {
      const follows = await this.followRepo.find({
        relations: ['follower', 'following'],
      });
      res.json(follows);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching follows', error });
    }
  }

  async getFollowById(req: Request, res: Response) {
    try {
      const follow = await this.followRepo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ['follower', 'following'],
      });
      if (!follow) return res.status(404).json({ message: 'Follow not found' });
      res.json(follow);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching follow', error });
    }
  }

  async createFollow(req: Request, res: Response) {
    try {
      const { followerId, followingId } = req.body;

      if (followerId === followingId) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
      }

      // check both users exist
      const user1 = await this.userRepo.findOneBy({ id: followerId });
      const user2 = await this.userRepo.findOneBy({ id: followingId });
      if (!user1 || !user2) {
        return res.status(404).json({ message: 'User not found' });
      }

      const already = await this.followRepo.findOneBy({ followerId, followingId });
      if (already) return res.status(409).json({ message: 'Already following' });

      const follow = this.followRepo.create({ followerId, followingId });
      const result = await this.followRepo.save(follow);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error creating follow', error });
    }
  }

  async deleteFollow(req: Request, res: Response) {
    try {
      const result = await this.followRepo.delete(parseInt(req.params.id));
      if (result.affected === 0) return res.status(404).json({ message: 'Follow not found' });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting follow', error });
    }
  }

  // get all followers for a user
  async getFollowers(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);

      const user = await this.userRepo.findOneBy({ id: userId });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const follows = await this.followRepo.find({
        where: { followingId: userId },
        relations: ['follower'],
        order: { createdAt: 'DESC' },
      });

      // just return the follower users
      const result = follows.map(f => ({
        id: f.follower.id,
        firstName: f.follower.firstName,
        lastName: f.follower.lastName,
        email: f.follower.email,
        followedAt: f.createdAt,
      }));

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error getting followers', error });
    }
  }
}
