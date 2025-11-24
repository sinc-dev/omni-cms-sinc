import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { posts } from './posts';
import { users } from './users';
import { organizations } from './organizations';
import { apiKeys } from './api-keys';

export const postAnalytics = sqliteTable(
  'post_analytics',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    date: integer('date', { mode: 'timestamp' }).notNull(), // Date (without time)
    views: integer('views').notNull().default(0),
    uniqueViews: integer('unique_views').notNull().default(0),
    avgTimeOnPage: integer('avg_time_on_page'), // In seconds
    bounceRate: integer('bounce_rate'), // Percentage (0-100)
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_post_analytics_post').on(table.postId),
    dateIdx: index('idx_post_analytics_date').on(table.date),
    postDateIdx: index('idx_post_analytics_post_date').on(table.postId, table.date),
  })
);

export const analyticsEvents = sqliteTable(
  'analytics_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .references(() => posts.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(), // view, click, scroll, etc.
    userId: text('user_id')
      .references(() => users.id),
    organizationId: text('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' }),
    apiKeyId: text('api_key_id')
      .references(() => apiKeys.id, { onDelete: 'cascade' }),
    metadata: text('metadata'), // JSON string for additional metadata
    ipHash: text('ip_hash'), // Hashed IP for privacy
    userAgent: text('user_agent'),
    referrer: text('referrer'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_analytics_events_post').on(table.postId),
    eventIdx: index('idx_analytics_events_type').on(table.eventType),
    createdAtIdx: index('idx_analytics_events_created').on(table.createdAt),
    orgIdx: index('idx_analytics_events_org').on(table.organizationId),
    apiKeyIdx: index('idx_analytics_events_api_key').on(table.apiKeyId),
    orgCreatedIdx: index('idx_analytics_events_org_created').on(table.organizationId, table.createdAt),
  })
);

// Relations
export const postAnalyticsRelations = relations(postAnalytics, ({ one }) => ({
  post: one(posts, {
    fields: [postAnalytics.postId],
    references: [posts.id],
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  post: one(posts, {
    fields: [analyticsEvents.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [analyticsEvents.organizationId],
    references: [organizations.id],
  }),
  apiKey: one(apiKeys, {
    fields: [analyticsEvents.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export type PostAnalytics = typeof postAnalytics.$inferSelect;
export type NewPostAnalytics = typeof postAnalytics.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

