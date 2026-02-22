ALTER TABLE `account` RENAME COLUMN `userID` TO `user_id`;--> statement-breakpoint
ALTER TABLE `category` RENAME COLUMN `userID` TO `user_id`;--> statement-breakpoint
ALTER TABLE `transaction` RENAME COLUMN `accountID` TO `account_id`;--> statement-breakpoint
ALTER TABLE `transaction` RENAME COLUMN `categoryID` TO `category_id`;--> statement-breakpoint
ALTER TABLE `transaction` RENAME COLUMN `userID` TO `user_id`;