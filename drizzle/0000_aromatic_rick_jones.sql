CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`listing_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_favorites_owner_listing` ON `favorites` (`owner`,`listing_id`);--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`seed_key` text,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`provider` text NOT NULL,
	`zone` text NOT NULL,
	`description` text NOT NULL,
	`features` text NOT NULL,
	`price` integer NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`available` integer DEFAULT 1 NOT NULL,
	`demo` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_listings_owner_seed` ON `listings` (`owner`,`seed_key`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`owner` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`consent` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`listing_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`provider` text NOT NULL,
	`quantity` integer NOT NULL,
	`date` text NOT NULL,
	`note` text NOT NULL,
	`base` integer NOT NULL,
	`fee` integer NOT NULL,
	`fee_bps` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_requests_owner_key` ON `requests` (`owner`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_requests_owner_created` ON `requests` (`owner`,`created_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`request_id` text NOT NULL,
	`listing_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reviews_owner_request` ON `reviews` (`owner`,`request_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`fee_bps` integer DEFAULT 500 NOT NULL
);
