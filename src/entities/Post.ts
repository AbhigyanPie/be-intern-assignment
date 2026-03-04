import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './User';
import { Like } from './Like';
import { Hashtag } from './Hashtag';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'integer' })
  userId: number;

  @ManyToOne(() => User, (user: User) => user.posts, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Like, (like: Like) => like.post)
  likes: Like[];

  @ManyToMany(() => Hashtag, (hashtag: Hashtag) => hashtag.posts)
  @JoinTable({
    name: 'post_hashtags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hashtagId', referencedColumnName: 'id' },
  })
  hashtags: Hashtag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
