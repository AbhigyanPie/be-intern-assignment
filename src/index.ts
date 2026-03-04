import express from 'express';
import dotenv from 'dotenv';
import { userRouter } from './routes/user.routes';
import { postRouter } from './routes/post.routes';
import { likeRouter } from './routes/like.routes';
import { followRouter } from './routes/follow.routes';
import { hashtagRouter } from './routes/hashtag.routes';
import { feedRouter } from './routes/feed.routes';
import { FeedController } from './controllers/feed.controller';
import { FollowController } from './controllers/follow.controller';
import { AppDataSource } from './data-source';

dotenv.config();

const app = express();
app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

app.get('/', (req, res) => {
  res.send('Welcome to the Social Media Platform API! Server is running successfully.');
});

// Entity CRUD routes
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/likes', likeRouter);
app.use('/api/follows', followRouter);
app.use('/api/hashtags', hashtagRouter);

// Special endpoints
app.use('/api/feed', feedRouter);

// GET /api/users/:id/followers
const followController = new FollowController();
app.get('/api/users/:id/followers', followController.getFollowers.bind(followController));

// GET /api/users/:id/activity
const feedController = new FeedController();
app.get('/api/users/:id/activity', feedController.getUserActivity.bind(feedController));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
