ALTER TABLE `user` ADD `verified` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `verification_token` text;