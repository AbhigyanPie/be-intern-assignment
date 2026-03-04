import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from './User';

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'integer' })
  followerId: number;

  @Column({ type: 'integer' })
  followingId: number;

  @ManyToOne(() => User, (user: User) => user.following, { onDelete: 'CASCADE' })
  follower: User;

  @ManyToOne(() => User, (user: User) => user.followers, { onDelete: 'CASCADE' })
  following: User;

  @CreateDateColumn()
  createdAt: Date;
}
