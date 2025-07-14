PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notification` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message` text NOT NULL,
	`user_id` text NOT NULL,
	`task_id` integer,
	`is_read` integer DEFAULT false NOT NULL,
	`updated_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_notification`("id", "message", "user_id", "task_id", "is_read", "updated_at", "created_at") SELECT "id", "message", "user_id", "task_id", "is_read", "updated_at", "created_at" FROM `notification`;--> statement-breakpoint
DROP TABLE `notification`;--> statement-breakpoint
ALTER TABLE `__new_notification` RENAME TO `notification`;--> statement-breakpoint
PRAGMA foreign_keys=ON;