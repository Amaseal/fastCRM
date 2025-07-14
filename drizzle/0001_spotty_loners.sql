ALTER TABLE `notification` ADD `task_id` integer REFERENCES tasks(id);--> statement-breakpoint
ALTER TABLE `notification` ADD `is_read` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `notification` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `notification` ADD `created_at` integer NOT NULL;