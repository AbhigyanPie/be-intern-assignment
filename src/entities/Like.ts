import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './User';
import { Post } from './Post';

@Entity('likes')
@Unique(['userId', 'postId'])
export class Like {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'integer' })
  postId: number;

  @ManyToOne(() => User, (user: User) => user.likes, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Post, (post: Post) => post.likes, { onDelete: 'CASCADE' })
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}
