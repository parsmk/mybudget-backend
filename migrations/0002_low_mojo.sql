PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_account` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cent_balance` integer NOT NULL,
	`type` text NOT NULL,
	`userID` text NOT NULL,
	FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "account_type_check" CHECK("__new_account"."type" in ('chequing', 'credit', 'cash'))
);
--> statement-breakpoint
INSERT INTO `__new_account`("id", "name", "cent_balance", "type", "userID") SELECT "id", "name", "cent_balance", "type", "userID" FROM `account`;--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
ALTER TABLE `__new_account` RENAME TO `account`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`userID` text NOT NULL,
	FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_category`("id", "name", "userID") SELECT "id", "name", "userID" FROM `category`;--> statement-breakpoint
DROP TABLE `category`;--> statement-breakpoint
ALTER TABLE `__new_category` RENAME TO `category`;--> statement-breakpoint
CREATE TABLE `__new_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`cent_inflow` integer,
	`cent_outflow` integer,
	`payee` text NOT NULL,
	`accountID` text NOT NULL,
	`categoryID` text,
	`userID` text NOT NULL,
	FOREIGN KEY (`accountID`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categoryID`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_transaction`("id", "date", "cent_inflow", "cent_outflow", "payee", "accountID", "categoryID", "userID") SELECT "id", "date", "cent_inflow", "cent_outflow", "payee", "accountID", "categoryID", "userID" FROM `transaction`;--> statement-breakpoint
DROP TABLE `transaction`;--> statement-breakpoint
ALTER TABLE `__new_transaction` RENAME TO `transaction`;