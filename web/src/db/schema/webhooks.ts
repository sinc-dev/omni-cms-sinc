import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { organizations } from './organizations';

export const webhooks = sqliteTable(
  'webhooks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    url: text('url').notNull(),
    events: text('events').notNull(), // JSON array of event names
    secret: text('secret').notNull(), // For HMAC signature
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_webhooks_org').on(table.organizationId),
    activeIdx: index('idx_webhooks_active').on(table.active),
  })
);

export const webhookLogs = sqliteTable(
  'webhook_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    webhookId: text('webhook_id')
      .notNull()
      .references(() => webhooks.id, { onDelete: 'cascade' }),
    event: text('event').notNull(),
    payload: text('payload').notNull(), // JSON string
    responseStatus: integer('response_status'),
    responseBody: text('response_body'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    webhookIdx: index('idx_webhook_logs_webhook').on(table.webhookId),
    eventIdx: index('idx_webhook_logs_event').on(table.event),
    createdAtIdx: index('idx_webhook_logs_created').on(table.createdAt),
  })
);

// Relations
export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [webhooks.organizationId],
    references: [organizations.id],
  }),
  logs: many(webhookLogs),
}));

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookLogs.webhookId],
    references: [webhooks.id],
  }),
}));

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;

