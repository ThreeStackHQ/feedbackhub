import { pgTable, text, timestamp, uuid, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const categoryEnum = pgEnum('category', ['feature', 'bug', 'improvement']);
export const statusEnum = pgEnum('status', ['open', 'planned', 'in_progress', 'completed', 'rejected']);
export const tierEnum = pgEnum('tier', ['free', 'pro', 'business']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'canceled']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Boards table (public voting boards)
export const boards = pgTable('boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Feature requests table
export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  board_id: uuid('board_id')
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: categoryEnum('category').notNull().default('feature'),
  status: statusEnum('status').notNull().default('open'),
  votes_count: integer('votes_count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Votes table (upvotes on requests)
export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  request_id: uuid('request_id')
    .notNull()
    .references(() => requests.id, { onDelete: 'cascade' }),
  email: text('email').notNull(), // Anonymous voting by email
  ip_address: text('ip_address').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Comments table
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  request_id: uuid('request_id')
    .notNull()
    .references(() => requests.id, { onDelete: 'cascade' }),
  author_name: text('author_name').notNull(),
  author_email: text('author_email').notNull(),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Subscriptions table (Stripe billing)
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tier: tierEnum('tier').notNull().default('free'),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  stripe_customer_id: text('stripe_customer_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  boards: many(boards),
  subscriptions: many(subscriptions),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  user: one(users, {
    fields: [boards.user_id],
    references: [users.id],
  }),
  requests: many(requests),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  board: one(boards, {
    fields: [requests.board_id],
    references: [boards.id],
  }),
  votes: many(votes),
  comments: many(comments),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  request: one(requests, {
    fields: [votes.request_id],
    references: [requests.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  request: one(requests, {
    fields: [comments.request_id],
    references: [requests.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.user_id],
    references: [users.id],
  }),
}));
