import { Request, Response } from 'express';
import { Post } from '../entities/Post';
import { Hashtag } from '../entities/Hashtag';
import { AppDataSource } from '../data-source';

// pulls #hashtags out of text
function extractTags(content: string): string[] {
  const matches = content.match(/#([a-zA-Z0-9_]+)/g);
  if (!matches) return [];
  const tags = matches.map(m => m.slice(1).toLowerCase());
  return [...new Set(tags)]; // remove dupes
}

export class PostController {
  private postRepo = AppDataSource.getRepository(Post);
  private hashtagRepo = AppDataSource.getRepository(Hashtag);

  async getAllPosts(req: Request, res: Response) {
    try {
      const posts = await this.postRepo.find({
        relations: ['user', 'hashtags', 'likes'],
        order: { createdAt: 'DESC' },
      });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching posts', error });
    }
  }

  async getPostById(req: Request, res: Response) {
    try {
      const post = await this.postRepo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ['user', 'hashtags', 'likes'],
      });
      if (!post) return res.status(404).json({ message: 'Post not found' });
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching post', error });
    }
  }

  async createPost(req: Request, res: Response) {
    try {
      const { content, userId } = req.body;

      // extract and save hashtags
      const tagNames = extractTags(content);
      const hashtags: Hashtag[] = [];
      for (const name of tagNames) {
        let existing = await this.hashtagRepo.findOneBy({ name });
        if (!existing) {
          existing = await this.hashtagRepo.save(this.hashtagRepo.create({ name }));
        }
        hashtags.push(existing);
      }

      const post = this.postRepo.create({ content, userId, hashtags });
      const saved = await this.postRepo.save(post);

      // return with all relations loaded
      const full = await this.postRepo.findOne({
        where: { id: saved.id },
        relations: ['user', 'hashtags', 'likes'],
      });
      res.status(201).json(full);
    } catch (error) {
      res.status(500).json({ message: 'Error creating post', error });
    }
  }

  async updatePost(req: Request, res: Response) {
    try {
      const post = await this.postRepo.findOne({
        where: { id: parseInt(req.params.id) },
        relations: ['hashtags'],
      });
      if (!post) return res.status(404).json({ message: 'Post not found' });

      if (req.body.content) {
        post.content = req.body.content;

        // update hashtags too
        const tagNames = extractTags(req.body.content);
        const hashtags: Hashtag[] = [];
        for (const name of tagNames) {
          let existing = await this.hashtagRepo.findOneBy({ name });
          if (!existing) {
            existing = await this.hashtagRepo.save(this.hashtagRepo.create({ name }));
          }
          hashtags.push(existing);
        }
        post.hashtags = hashtags;
      }

      await this.postRepo.save(post);
      const updated = await this.postRepo.findOne({
        where: { id: post.id },
        relations: ['user', 'hashtags', 'likes'],
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Error updating post', error });
    }
  }

  async deletePost(req: Request, res: Response) {
    try {
      const result = await this.postRepo.delete(parseInt(req.params.id));
      if (result.affected === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting post', error });
    }
  }

  // search posts by hashtag
  async getPostsByHashtag(req: Request, res: Response) {
    try {
      const tag = req.params.tag.toLowerCase().replace('#', '');

      const posts = await this.postRepo
        .createQueryBuilder('post')
        .innerJoin('post.hashtags', 'ht', 'ht.name = :tag', { tag })
        .leftJoinAndSelect('post.user', 'user')
        .leftJoinAndSelect('post.hashtags', 'hashtags')
        .leftJoinAndSelect('post.likes', 'likes')
        .orderBy('post.createdAt', 'DESC')
        .getMany();

      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Error searching by hashtag', error });
    }
  }
}
