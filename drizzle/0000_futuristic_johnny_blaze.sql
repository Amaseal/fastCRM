CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`description` text,
	`address` text,
	`type` text DEFAULT 'BTC' NOT NULL,
	`total_ordered` integer,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`download_url` text NOT NULL,
	`size` integer NOT NULL,
	`task_id` integer,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`article` text NOT NULL,
	`image` text,
	`manufacturer` text,
	`gsm` integer,
	`width` integer,
	`remaining` integer DEFAULT 0 NOT NULL,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cost` integer NOT NULL,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tabs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`color` text NOT NULL,
	`tag` integer,
	`is_protected` integer DEFAULT false NOT NULL,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL,
	FOREIGN KEY (`tag`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`tag` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`is_protected` integer DEFAULT false NOT NULL,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`tab` integer,
	`client` integer,
	`manager` text,
	`responsible_person` text,
	`count` integer,
	`end_date` text,
	`is_printed` integer,
	`price` integer,
	`preview` text,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL,
	FOREIGN KEY (`tab`) REFERENCES `tabs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`manager`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`responsible_person`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `taskMaterials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`material_id` integer NOT NULL,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `taskProducts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`count` integer DEFAULT 1,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text,
	`nextcloud` text,
	`updated_at` integer,
	`created_at` integer DEFAULT '"2025-06-10T11:50:26.409Z"' NOT NULL
);
