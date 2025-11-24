CREATE TABLE `post_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`share_type` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX IF EXISTS `idx_presence_post_user`;--> statement-breakpoint
ALTER TABLE analytics_events ADD `organization_id` text REFERENCES organizations(id);--> statement-breakpoint
ALTER TABLE analytics_events ADD `api_key_id` text REFERENCES api_keys(id);--> statement-breakpoint
ALTER TABLE analytics_events ADD `metadata` text;--> statement-breakpoint
ALTER TABLE api_keys ADD `scopes` text;--> statement-breakpoint
ALTER TABLE api_keys ADD `revoked_at` integer;--> statement-breakpoint
ALTER TABLE api_keys ADD `rotated_from_id` text;--> statement-breakpoint
ALTER TABLE posts ADD `share_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_post_shares_post` ON `post_shares` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_shares_type` ON `post_shares` (`share_type`);--> statement-breakpoint
CREATE INDEX `idx_post_shares_created` ON `post_shares` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_analytics_events_org` ON `analytics_events` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_analytics_events_api_key` ON `analytics_events` (`api_key_id`);--> statement-breakpoint
CREATE INDEX `idx_analytics_events_org_created` ON `analytics_events` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_presence_post_user` ON `presence` (`post_id`,`user_id`);--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/