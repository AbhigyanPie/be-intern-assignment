import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Post } from './Post';

@Entity('hashtags')
export class Hashtag {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @ManyToMany(() => Post, (post: Post) => post.hashtags)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;
}
