# Post-MVP Database Migrations Guide

This document outlines the database schema changes required for all post-MVP features.

## Overview

The following new tables and fields have been added to support post-MVP features:

## New Tables

### 1. `post_edit_locks`
Supports edit locking and takeover functionality.

**Fields:**
- `id` (text, primary key)
- `post_id` (text, foreign key to posts)
- `user_id` (text, foreign key to users)
- `locked_at` (timestamp)
- `expires_at` (timestamp)

**Indexes:**
- `idx_post_edit_locks_post` on `post_id`
- `idx_post_edit_locks_user` on `user_id`
- `idx_post_edit_locks_expires` on `expires_at`
- `idx_post_edit_locks_post_user` on `post_id, user_id`

### 2. `post_versions`
Stores version history for posts.

**Fields:**
- `id` (text, primary key)
- `post_id` (text, foreign key to posts)
- `version_number` (integer)
- `title` (text)
- `slug` (text)
- `content` (text, nullable)
- `excerpt` (text, nullable)
- `custom_fields` (text, JSON)
- `created_by` (text, foreign key to users)
- `created_at` (timestamp)

**Indexes:**
- `idx_post_versions_post` on `post_id`
- `idx_post_versions_version` on `post_id, version_number`
- `idx_post_versions_created_by` on `created_by`

### 3. `content_blocks`
Reusable content blocks.

**Fields:**
- `id` (text, primary key)
- `organization_id` (text, foreign key to organizations)
- `name` (text)
- `slug` (text)
- `block_type` (text: text, image, video, gallery, cta, code, embed)
- `content` (text, JSON)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `idx_content_blocks_org` on `organization_id`
- `idx_content_blocks_type` on `block_type`
- `idx_content_blocks_org_slug` on `organization_id, slug`

### 4. `post_content_blocks`
Junction table for posts and content blocks.

**Fields:**
- `id` (text, primary key)
- `post_id` (text, foreign key to posts)
- `block_id` (text, foreign key to content_blocks)
- `order` (integer)
- `created_at` (timestamp)

**Indexes:**
- `idx_post_content_blocks_post` on `post_id`
- `idx_post_content_blocks_block` on `block_id`
- `idx_post_content_blocks_post_order` on `post_id, order`

### 5. `post_templates`
Post templates for quick content creation.

**Fields:**
- `id` (text, primary key)
- `organization_id` (text, foreign key to organizations)
- `post_type_id` (text, foreign key to post_types)
- `name` (text)
- `slug` (text)
- `content` (text, JSON)
- `custom_fields` (text, JSON, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `idx_post_templates_org` on `organization_id`
- `idx_post_templates_type` on `post_type_id`
- `idx_post_templates_org_slug` on `organization_id, slug`

### 6. `workflow_comments`
Comments for workflow reviews.

**Fields:**
- `id` (text, primary key)
- `post_id` (text, foreign key to posts)
- `user_id` (text, foreign key to users)
- `comment` (text)
- `created_at` (timestamp)

**Indexes:**
- `idx_workflow_comments_post` on `post_id`
- `idx_workflow_comments_user` on `user_id`

### 7. `workflow_assignments`
Reviewer assignments for posts.

**Fields:**
- `id` (text, primary key)
- `post_id` (text, foreign key to posts)
- `reviewer_id` (text, foreign key to users)
- `assigned_at` (timestamp)

**Indexes:**
- `idx_workflow_assignments_post` on `post_id`
- `idx_workflow_assignments_reviewer` on `reviewer_id`

### 8. `presence`
User presence tracking for collaboration.

**Fields:**
- `id` (text, primary key)
- `post_id` (text, foreign key to posts)
- `user_id` (text, foreign key to users)
- `last_seen_at` (timestamp)

**Indexes:**
- `idx_presence_post` on `post_id`
- `idx_presence_user` on `user_id`
- `idx_presence_post_user` on `post_id, user_id`

### 9. `webhooks`
Webhook configurations.

**Fields:**
- `id` (text, primary key)
- `organization_id` (text, foreign key to organizations)
- `name` (text)
- `url` (text)
- `events` (text, JSON array)
- `secret` (text)
- `active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `idx_webhooks_org` on `organization_id`
- `idx_webhooks_active` on `active`

### 10. `webhook_logs`
Webhook delivery logs.

**Fields:**
- `id` (text, primary key)
- `webhook_id` (text, foreign key to webhooks)
- `event` (text)
- `payload` (text, JSON)
- `response_status` (integer, nullable)
- `response_body` (text, nullable)
- `created_at` (timestamp)

**Indexes:**
- `idx_webhook_logs_webhook` on `webhook_id`
- `idx_webhook_logs_event` on `event`
- `idx_webhook_logs_created` on `created_at`

### 11. `post_analytics`
Daily aggregated analytics for posts.

**Fields:**
- `id` (text, primary key)
- `post_id` (text, foreign key to posts)
- `date` (timestamp, date only)
- `views` (integer)
- `unique_views` (integer)
- `avg_time_on_page` (integer, seconds, nullable)
- `bounce_rate` (integer, percentage, nullable)
- `created_at` (timestamp)

**Indexes:**
- `idx_post_analytics_post` on `post_id`
- `idx_post_analytics_date` on `date`
- `idx_post_analytics_post_date` on `post_id, date`

### 12. `analytics_events`
Individual analytics events.

**Fields:**
- `id` (text, primary key)
- `post_id` (text, foreign key to posts, nullable)
- `event_type` (text: view, click, scroll, time)
- `user_id` (text, foreign key to users, nullable)
- `ip_hash` (text, hashed IP)
- `user_agent` (text, nullable)
- `referrer` (text, nullable)
- `created_at` (timestamp)

**Indexes:**
- `idx_analytics_events_post` on `post_id`
- `idx_analytics_events_type` on `event_type`
- `idx_analytics_events_created` on `created_at`

## Modified Tables

### `posts` table additions:

**New Fields:**
- `scheduled_publish_at` (timestamp, nullable) - For scheduled publishing
- `workflow_status` (text, nullable) - draft, pending_review, approved, rejected
- `meta_title` (text, nullable) - SEO meta title
- `meta_description` (text, nullable) - SEO meta description
- `meta_keywords` (text, nullable) - SEO keywords
- `og_image_id` (text, nullable) - Open Graph image reference
- `canonical_url` (text, nullable) - Canonical URL
- `structured_data` (text, JSON, nullable) - Structured data markup

## Migration Steps

1. **Generate Migration:**
   ```bash
   pnpm db:generate
   ```

2. **Review Generated Migration:**
   Check the generated SQL in `drizzle/migrations/` to ensure all changes are correct.

3. **Apply Migration Locally:**
   ```bash
   pnpm db:migrate
   ```

4. **Test Migration:**
   - Verify all new tables are created
   - Check indexes are properly created
   - Test foreign key constraints
   - Verify data integrity

5. **Apply to Production:**
   ```bash
   pnpm db:migrate:prod
   ```

## Data Migration Notes

- **Existing Posts**: Existing posts will have `workflow_status` as `NULL`, which should be treated as `draft`
- **Scheduled Publishing**: The `scheduled_publish_at` field is nullable, so existing posts are unaffected
- **SEO Fields**: All SEO fields are nullable, so existing posts can be updated gradually
- **Version History**: No existing versions will be created automatically - versioning starts from the next save

## Rollback

If you need to rollback these migrations:

1. Create a rollback migration that:
   - Drops all new tables
   - Removes new columns from `posts` table
   - Drops all new indexes

2. Apply rollback:
   ```bash
   pnpm db:migrate
   ```

**Warning**: Rolling back will delete all data in the new tables. Ensure you have backups if needed.

## Performance Considerations

- **Analytics Tables**: Consider archiving old analytics data periodically
- **Version History**: The version manager automatically cleans up old versions (keeps last 50)
- **Webhook Logs**: Consider implementing log rotation for webhook logs
- **Presence**: Presence records are automatically cleaned up when users leave (via cascade delete)

## Indexes

All new tables include appropriate indexes for common query patterns. Monitor query performance and add additional indexes if needed based on usage patterns.

