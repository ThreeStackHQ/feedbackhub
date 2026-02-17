# @feedbackhub/db

Database package for FeedbackHub using Drizzle ORM and PostgreSQL.

## Schema

### Tables

**users**
- Primary authentication table
- Fields: id, email, name, password_hash, created_at, updated_at

**boards**
- Public voting boards (one per user workspace)
- Fields: id, slug, name, user_id (FK), description, created_at
- Unique constraint on slug

**requests**
- Feature requests submitted to boards
- Fields: id, board_id (FK), title, description, category, status, votes_count, created_at, updated_at
- Category: feature | bug | improvement
- Status: open | planned | in_progress | completed | rejected

**votes**
- Upvotes on requests (anonymous, tracked by email)
- Fields: id, request_id (FK), email, ip_address, created_at

**comments**
- Comments on feature requests
- Fields: id, request_id (FK), author_name, author_email, content, created_at

**subscriptions**
- Stripe billing subscriptions
- Fields: id, user_id (FK), tier, status, stripe_customer_id, created_at, updated_at
- Tier: free | pro | business
- Status: active | inactive | canceled

### Relationships

- users → boards (one-to-many)
- users → subscriptions (one-to-many)
- boards → requests (one-to-many)
- requests → votes (one-to-many)
- requests → comments (one-to-many)

All foreign keys have `ON DELETE CASCADE` for automatic cleanup.

## Setup

1. Set `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

2. Generate migrations:
   ```bash
   pnpm db:generate
   ```

3. Run migrations:
   ```bash
   pnpm db:migrate
   ```

4. (Optional) Open Drizzle Studio to browse data:
   ```bash
   pnpm db:studio
   ```

## Scripts

- `pnpm db:generate` — Generate migration files from schema
- `pnpm db:migrate` — Run pending migrations
- `pnpm db:push` — Push schema changes directly (dev only)
- `pnpm db:studio` — Open Drizzle Studio GUI

## Usage

```typescript
import { db, users, boards, requests } from '@feedbackhub/db';

// Query users
const allUsers = await db.select().from(users);

// Insert a board
const newBoard = await db.insert(boards).values({
  slug: 'my-saas',
  name: 'My SaaS Feedback',
  user_id: userId,
}).returning();
```

## Migration History

- `0000_cold_shadowcat.sql` — Initial schema (6 tables, 4 enums)
