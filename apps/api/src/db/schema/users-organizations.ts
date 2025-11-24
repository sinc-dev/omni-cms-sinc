import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { users } from './users';
import { organizations } from './organizations';
import { roles } from './roles';

export const usersOrganizations = sqliteTable(
  'users_organizations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdx: index('idx_users_orgs_user').on(table.userId),
    orgIdx: index('idx_users_orgs_org').on(table.organizationId),
    userOrgIdx: uniqueIndex('idx_users_orgs_unique').on(table.userId, table.organizationId),
  })
);

// Relations
export const usersOrganizationsRelations = relations(usersOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [usersOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [usersOrganizations.organizationId],
    references: [organizations.id],
  }),
  role: one(roles, {
    fields: [usersOrganizations.roleId],
    references: [roles.id],
  }),
}));

export type UserOrganization = typeof usersOrganizations.$inferSelect;
export type NewUserOrganization = typeof usersOrganizations.$inferInsert;
