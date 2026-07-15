CREATE TABLE `blocked_apps` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`isBlocked` integer DEFAULT 0 NOT NULL,
	`updatedAt` text NOT NULL
);
