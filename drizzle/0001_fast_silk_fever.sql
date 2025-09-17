CREATE TABLE `final_pitches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`presented_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `judge_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`judge_name` text NOT NULL,
	`team_id` integer NOT NULL,
	`score` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`text` text NOT NULL,
	`order` integer NOT NULL,
	`token_delta_marketing` integer DEFAULT 0 NOT NULL,
	`token_delta_capital` integer DEFAULT 0 NOT NULL,
	`token_delta_team` integer DEFAULT 0 NOT NULL,
	`token_delta_strategy` integer DEFAULT 0 NOT NULL,
	`total_score_delta` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `peer_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_team_id` integer NOT NULL,
	`to_team_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`from_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pitches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`video_url` text,
	`deck_url` text,
	`presented_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`order` integer NOT NULL,
	`max_token_per_question` integer DEFAULT 4 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quiz_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`member_count` integer DEFAULT 5 NOT NULL,
	`answers` text NOT NULL,
	`raw_score` integer NOT NULL,
	`tokens_marketing` integer DEFAULT 0 NOT NULL,
	`tokens_capital` integer DEFAULT 0 NOT NULL,
	`tokens_team` integer DEFAULT 0 NOT NULL,
	`tokens_strategy` integer DEFAULT 0 NOT NULL,
	`duration_seconds` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`day` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_invites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`college` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_name_unique` ON `teams` (`name`);--> statement-breakpoint
CREATE TABLE `token_conversions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`category` text NOT NULL,
	`tokens_used` integer NOT NULL,
	`votes_gained` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_team_id` integer NOT NULL,
	`to_team_id` integer NOT NULL,
	`value` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`from_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
