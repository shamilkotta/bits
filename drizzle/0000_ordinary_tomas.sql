CREATE TABLE `habit_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`habitId` integer NOT NULL,
	`date` text NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`habitId`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_date_idx` ON `habit_completions` (`habitId`,`date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'water' NOT NULL,
	`frequency` text DEFAULT 'Daily' NOT NULL,
	`customDays` text DEFAULT '[]',
	`goal` integer DEFAULT 1 NOT NULL,
	`times` text DEFAULT '["Morning"]',
	`createdAt` text NOT NULL
);
