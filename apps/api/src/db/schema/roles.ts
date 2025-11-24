import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';

export const roles = sqliteTable(
  'roles',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text('name').notNull().unique(),
    description: text('description'),
    permissions: text('permissions').notNull(), // JSON array of permission strings
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    nameIdx: uniqueIndex('idx_roles_name').on(table.name),
  })
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
