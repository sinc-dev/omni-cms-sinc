CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text,
	`event_type` text NOT NULL,
	`user_id` text,
	`ip_hash` text,
	`user_agent` text,
	`referrer` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `post_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`date` integer NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`unique_views` integer DEFAULT 0 NOT NULL,
	`avg_time_on_page` integer,
	`bounce_rate` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`key` text NOT NULL,
	`key_prefix` text NOT NULL,
	`rate_limit` integer DEFAULT 10000 NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	`expires_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `content_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`block_type` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_content_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`block_id` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`block_id`) REFERENCES `content_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `custom_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`field_type` text NOT NULL,
	`settings` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`domain` text,
	`settings` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`is_super_admin` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`permissions` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users_organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`role_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `post_types` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`is_hierarchical` integer DEFAULT false NOT NULL,
	`settings` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_field_values` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`custom_field_id` text NOT NULL,
	`value` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`from_post_id` text NOT NULL,
	`to_post_id` text NOT NULL,
	`relationship_type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`from_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`post_type_id` text NOT NULL,
	`author_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text,
	`excerpt` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`workflow_status` text DEFAULT 'draft',
	`parent_id` text,
	`featured_image_id` text,
	`published_at` integer,
	`scheduled_publish_at` integer,
	`meta_title` text,
	`meta_description` text,
	`meta_keywords` text,
	`og_image_id` text,
	`canonical_url` text,
	`structured_data` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_type_id`) REFERENCES `post_types`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `post_taxonomies` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`taxonomy_term_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`taxonomy_term_id`) REFERENCES `taxonomy_terms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `taxonomies` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`is_hierarchical` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `taxonomy_terms` (
	`id` text PRIMARY KEY NOT NULL,
	`taxonomy_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`parent_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`taxonomy_id`) REFERENCES `taxonomies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `taxonomy_terms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`uploader_id` text NOT NULL,
	`filename` text NOT NULL,
	`file_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`width` integer,
	`height` integer,
	`alt_text` text,
	`caption` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `post_edit_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`locked_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text,
	`excerpt` text,
	`custom_fields` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `post_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`post_type_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`content` text NOT NULL,
	`custom_fields` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`post_type_id`) REFERENCES `post_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workflow_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workflow_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`comment` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `presence` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`last_seen_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `webhook_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`webhook_id` text NOT NULL,
	`event` text NOT NULL,
	`payload` text NOT NULL,
	`response_status` integer,
	`response_body` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`events` text NOT NULL,
	`secret` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_events_post` ON `analytics_events` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_analytics_events_type` ON `analytics_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_analytics_events_created` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_post_analytics_post` ON `post_analytics` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_analytics_date` ON `post_analytics` (`date`);--> statement-breakpoint
CREATE INDEX `idx_post_analytics_post_date` ON `post_analytics` (`post_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_org` ON `api_keys` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_key` ON `api_keys` (`key`);--> statement-breakpoint
CREATE INDEX `idx_content_blocks_org` ON `content_blocks` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_content_blocks_type` ON `content_blocks` (`block_type`);--> statement-breakpoint
CREATE INDEX `idx_content_blocks_org_slug` ON `content_blocks` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_post_content_blocks_post` ON `post_content_blocks` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_content_blocks_block` ON `post_content_blocks` (`block_id`);--> statement-breakpoint
CREATE INDEX `idx_post_content_blocks_post_order` ON `post_content_blocks` (`post_id`,`order`);--> statement-breakpoint
CREATE INDEX `idx_custom_fields_org` ON `custom_fields` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_custom_fields_org_slug` ON `custom_fields` (`organization_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_organizations_slug` ON `organizations` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_roles_name` ON `roles` (`name`);--> statement-breakpoint
CREATE INDEX `idx_users_orgs_user` ON `users_organizations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_users_orgs_org` ON `users_organizations` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_orgs_unique` ON `users_organizations` (`user_id`,`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_post_types_org` ON `post_types` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_post_types_org_slug` ON `post_types` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_post_field_values_post` ON `post_field_values` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_field_values_field` ON `post_field_values` (`custom_field_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_post_field_values_unique` ON `post_field_values` (`post_id`,`custom_field_id`);--> statement-breakpoint
CREATE INDEX `idx_post_relationships_from` ON `post_relationships` (`from_post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_relationships_to` ON `post_relationships` (`to_post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_relationships_type` ON `post_relationships` (`relationship_type`);--> statement-breakpoint
CREATE INDEX `idx_posts_org` ON `posts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_type` ON `posts` (`post_type_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_author` ON `posts` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_status` ON `posts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_posts_parent` ON `posts` (`parent_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_org_status` ON `posts` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_posts_org_type` ON `posts` (`organization_id`,`post_type_id`);--> statement-breakpoint
CREATE INDEX `idx_posts_org_type_status` ON `posts` (`organization_id`,`post_type_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_posts_published` ON `posts` (`organization_id`,`status`,`published_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_posts_org_type_slug` ON `posts` (`organization_id`,`post_type_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_post_taxonomies_post` ON `post_taxonomies` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_taxonomies_term` ON `post_taxonomies` (`taxonomy_term_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_post_taxonomies_unique` ON `post_taxonomies` (`post_id`,`taxonomy_term_id`);--> statement-breakpoint
CREATE INDEX `idx_taxonomies_org` ON `taxonomies` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_taxonomies_org_slug` ON `taxonomies` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_taxonomy_terms_taxonomy` ON `taxonomy_terms` (`taxonomy_id`);--> statement-breakpoint
CREATE INDEX `idx_taxonomy_terms_parent` ON `taxonomy_terms` (`parent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_taxonomy_terms_taxonomy_slug` ON `taxonomy_terms` (`taxonomy_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_media_org` ON `media` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_media_uploader` ON `media` (`uploader_id`);--> statement-breakpoint
CREATE INDEX `idx_media_type` ON `media` (`mime_type`);--> statement-breakpoint
CREATE INDEX `idx_post_edit_locks_post` ON `post_edit_locks` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_edit_locks_user` ON `post_edit_locks` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_post_edit_locks_expires` ON `post_edit_locks` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_post_edit_locks_post_user` ON `post_edit_locks` (`post_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_post_versions_post` ON `post_versions` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_versions_version` ON `post_versions` (`post_id`,`version_number`);--> statement-breakpoint
CREATE INDEX `idx_post_versions_created_by` ON `post_versions` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_post_templates_org` ON `post_templates` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_post_templates_type` ON `post_templates` (`post_type_id`);--> statement-breakpoint
CREATE INDEX `idx_post_templates_org_slug` ON `post_templates` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_workflow_assignments_post` ON `workflow_assignments` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_assignments_reviewer` ON `workflow_assignments` (`reviewer_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_comments_post` ON `workflow_comments` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_workflow_comments_user` ON `workflow_comments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_presence_post` ON `presence` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_presence_user` ON `presence` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_presence_post_user` ON `presence` (`post_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_webhook_logs_webhook` ON `webhook_logs` (`webhook_id`);--> statement-breakpoint
CREATE INDEX `idx_webhook_logs_event` ON `webhook_logs` (`event`);--> statement-breakpoint
CREATE INDEX `idx_webhook_logs_created` ON `webhook_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_webhooks_org` ON `webhooks` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_webhooks_active` ON `webhooks` (`active`);