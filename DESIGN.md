# Design Document

## Database Schema Design

### Entity Relationships

```
users (1) ──── (N) posts          : A user creates many posts
users (1) ──── (N) likes          : A user gives many likes
users (1) ──── (N) follows        : A user follows many users (as follower)
users (1) ──── (N) follows        : A user is followed by many users (as following)
posts (1) ──── (N) likes          : A post receives many likes
posts (N) ──── (N) hashtags       : Posts and hashtags have a many-to-many relationship
                                    (via post_hashtags junction table)
```

### Tables

**users** — Core user profile data.
- `id` (PK, auto-increment)
- `firstName` (varchar 255, NOT NULL)
- `lastName` (varchar 255, NOT NULL)
- `email` (varchar 255, UNIQUE, NOT NULL)
- `createdAt` (datetime)
- `updatedAt` (datetime)

**posts** — User-generated text content.
- `id` (PK, auto-increment)
- `content` (text, NOT NULL)
- `userId` (FK → users.id, ON DELETE CASCADE)
- `createdAt` (datetime)
- `updatedAt` (datetime)

**hashtags** — Normalized hashtag storage.
- `id` (PK, auto-increment)
- `name` (varchar 255, UNIQUE, NOT NULL) — stored lowercase, without `#` prefix
- `createdAt` (datetime)

**post_hashtags** — Junction table for posts ↔ hashtags many-to-many.
- `postId` (FK → posts.id, ON DELETE CASCADE)
- `hashtagId` (FK → hashtags.id, ON DELETE CASCADE)
- Composite PK: (postId, hashtagId)

**likes** — Tracks which user liked which post.
- `id` (PK, auto-increment)
- `userId` (FK → users.id, ON DELETE CASCADE)
- `postId` (FK → posts.id, ON DELETE CASCADE)
- `createdAt` (datetime)
- UNIQUE constraint on (userId, postId) — prevents duplicate likes

**follows** — Tracks follower/following relationships.
- `id` (PK, auto-increment)
- `followerId` (FK → users.id, ON DELETE CASCADE)
- `followingId` (FK → users.id, ON DELETE CASCADE)
- `createdAt` (datetime)
- UNIQUE constraint on (followerId, followingId) — prevents duplicate follows

### Why These Constraints

- **CASCADE deletes**: When a user is deleted, their posts, likes, and follow relationships are automatically cleaned up. When a post is deleted, its likes and hashtag links are removed.
- **UNIQUE on (userId, postId) in likes**: Enforced at the database level so a user can only like a post once, regardless of application-level race conditions.
- **UNIQUE on (followerId, followingId) in follows**: Same principle — prevents duplicate follow relationships.
- **Self-follow prevention**: Handled in the application layer (controller checks `followerId !== followingId`) since SQLite CHECK constraints have limited support in TypeORM migrations.

## Indexing Strategy

### Indexes Created

| Table | Index | Columns | Rationale |
|-------|-------|---------|-----------|
| posts | idx_posts_userId | userId | Feed query filters posts by userId of followed users. Without this index, every feed request scans the full posts table. |
| posts | idx_posts_createdAt | createdAt | Feed and listing queries sort by creation date. Index enables efficient ORDER BY without a filesort. |
| likes | idx_likes_userId | userId | Activity endpoint fetches all likes by a specific user. |
| likes | idx_likes_postId | postId | Like count aggregation per post. When loading a post with its like count, this index avoids a full table scan of likes. |
| follows | idx_follows_followerId | followerId | Feed query: finding who a user follows requires filtering by followerId. This is the most critical query path. |
| follows | idx_follows_followingId | followingId | Followers endpoint: finding who follows a specific user. |
| post_hashtags | idx_post_hashtags_hashtagId | hashtagId | Hashtag search endpoint filters by hashtagId. The composite PK already covers postId lookups. |
| hashtags | (built-in UNIQUE) | name | Hashtag lookup by name is automatic via the UNIQUE constraint index. |

### Why Not More Indexes

Adding an index on every column would slow down writes (INSERT/UPDATE/DELETE) since each index must be maintained. The indexes above target the specific query patterns required by the API endpoints. For a small-to-medium dataset, SQLite's performance is adequate without further indexing.

## Scalability Considerations

### Current Architecture (SQLite)

SQLite is a single-file embedded database. It works well for this assignment scope but has limitations:
- Single writer at a time (no concurrent writes)
- No network access (must run on the same machine as the app)
- Limited to ~1TB practical size

### Scaling Path

If this platform needed to handle more users:

1. **Database migration**: Move from SQLite to PostgreSQL or MySQL. TypeORM makes this straightforward — change the `data-source.ts` config and re-run migrations. The entity definitions and query code remain unchanged.

2. **Connection pooling**: PostgreSQL/MySQL support connection pools, allowing multiple concurrent queries. TypeORM handles this via the `extra` config option.

3. **Feed optimization**: The current feed query fetches all followed user IDs first, then queries posts with `IN (:...ids)`. At scale, this could be replaced with:
   - A materialized feed table (fan-out on write)
   - Redis-cached feed per user
   - Cursor-based pagination instead of offset-based (offset pagination degrades at high offsets)

4. **Like counts**: Currently computed via `post.likes.length` which loads all like records. At scale, denormalize the like count into the posts table and update it atomically on like/unlike.

5. **Hashtag search**: For large datasets, add full-text search via PostgreSQL's `tsvector` or Elasticsearch for more complex search requirements.

6. **Activity endpoint**: Currently aggregates across three tables in-memory. At scale, this would benefit from an event-sourcing pattern where all activities are written to a single `activities` table as they happen, rather than being reconstructed from multiple sources.

### Design Decisions

- **Hashtag auto-extraction**: Hashtags are parsed from post content using regex when a post is created or updated. This avoids requiring the client to send hashtags separately and keeps the API simple.
- **Normalized hashtag storage**: Hashtags are stored in a separate table with a junction table, rather than as a JSON array on posts. This enables efficient hashtag search and avoids data duplication.
- **No authentication**: The assignment focuses on data modeling and API design. Authentication would add JWT/session middleware but wouldn't change the core schema.
- **TypeORM with migrations**: Using migrations instead of `synchronize: true` gives explicit control over schema changes and makes the database setup reproducible.
