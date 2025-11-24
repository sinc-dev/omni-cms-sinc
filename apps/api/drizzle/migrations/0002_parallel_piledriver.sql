CREATE TABLE `post_type_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`post_type_id` text NOT NULL,
	`custom_field_id` text NOT NULL,
	`is_required` integer DEFAULT false NOT NULL,
	`default_value` text,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_type_id`) REFERENCES `post_types`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE api_keys ADD `updated_at` integer NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_post_type_fields_type` ON `post_type_fields` (`post_type_id`);--> statement-breakpoint
CREATE INDEX `idx_post_type_fields_field` ON `post_type_fields` (`custom_field_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_post_type_fields_unique` ON `post_type_fields` (`post_type_id`,`custom_field_id`);