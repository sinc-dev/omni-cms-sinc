import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { posts } from './posts';
import { users } from './users';

// Workflow status is stored in posts table, but we need these tables for workflow management
export const workflowComments = sqliteTable(
  'workflow_comments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    comment: text('comment').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_workflow_comments_post').on(table.postId),
    userIdx: index('idx_workflow_comments_user').on(table.userId),
  })
);

export const workflowAssignments = sqliteTable(
  'workflow_assignments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => users.id),
    assignedAt: integer('assigned_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_workflow_assignments_post').on(table.postId),
    reviewerIdx: index('idx_workflow_assignments_reviewer').on(table.reviewerId),
  })
);

// Relations
export const workflowCommentsRelations = relations(workflowComments, ({ one }) => ({
  post: one(posts, {
    fields: [workflowComments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [workflowComments.userId],
    references: [users.id],
  }),
}));

export const workflowAssignmentsRelations = relations(workflowAssignments, ({ one }) => ({
  post: one(posts, {
    fields: [workflowAssignments.postId],
    references: [posts.id],
  }),
  reviewer: one(users, {
    fields: [workflowAssignments.reviewerId],
    references: [users.id],
  }),
}));

export type WorkflowComment = typeof workflowComments.$inferSelect;
export type NewWorkflowComment = typeof workflowComments.$inferInsert;
export type WorkflowAssignment = typeof workflowAssignments.$inferSelect;
export type NewWorkflowAssignment = typeof workflowAssignments.$inferInsert;

