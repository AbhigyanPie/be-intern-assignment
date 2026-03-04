import { Request, Response } from 'express';
import { Hashtag } from '../entities/Hashtag';
import { AppDataSource } from '../data-source';

export class HashtagController {
  private hashtagRepository = AppDataSource.getRepository(Hashtag);

  async getAllHashtags(req: Request, res: Response) {
    try {
      const hashtags = await this.hashtagRepository.find({
        order: { createdAt: 'DESC' },
      });
      res.json(hashtags);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching hashtags', error });
    }
  }

  async getHashtagById(req: Request, res: Response) {
    try {
      const hashtag = await this.hashtagRepository.findOne({
        where: { id: parseInt(req.params.id) },
      });
      if (!hashtag) {
        return res.status(404).json({ message: 'Hashtag not found' });
      }
      res.json(hashtag);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching hashtag', error });
    }
  }

  async createHashtag(req: Request, res: Response) {
    try {
      const { name } = req.body;
      const normalized = name.toLowerCase().replace(/^#/, '').trim();

      const existing = await this.hashtagRepository.findOneBy({ name: normalized });
      if (existing) {
        return res.status(409).json({ message: 'Hashtag already exists', hashtag: existing });
      }

      const hashtag = this.hashtagRepository.create({ name: normalized });
      const result = await this.hashtagRepository.save(hashtag);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error creating hashtag', error });
    }
  }

  async updateHashtag(req: Request, res: Response) {
    try {
      const hashtag = await this.hashtagRepository.findOneBy({
        id: parseInt(req.params.id),
      });
      if (!hashtag) {
        return res.status(404).json({ message: 'Hashtag not found' });
      }
      if (req.body.name) {
        hashtag.name = req.body.name.toLowerCase().replace(/^#/, '').trim();
      }
      const result = await this.hashtagRepository.save(hashtag);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error updating hashtag', error });
    }
  }

  async deleteHashtag(req: Request, res: Response) {
    try {
      const result = await this.hashtagRepository.delete(parseInt(req.params.id));
      if (result.affected === 0) {
        return res.status(404).json({ message: 'Hashtag not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting hashtag', error });
    }
  }
}
