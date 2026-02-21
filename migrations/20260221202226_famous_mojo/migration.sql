CREATE TABLE `account` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`cent_balance` integer NOT NULL,
	`type` text NOT NULL,
	`userID` text NOT NULL,
	CONSTRAINT `fk_account_userID_user_id_fk` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT "account_type_check" CHECK("type" in ('chequing', 'credit', 'cash'))
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`userID` text NOT NULL,
	CONSTRAINT `fk_category_userID_user_id_fk` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY,
	`date` text NOT NULL,
	`cent_inflow` integer,
	`cent_outflow` integer,
	`payee` text NOT NULL,
	`accountID` text NOT NULL,
	`categoryID` text,
	`userID` text NOT NULL,
	CONSTRAINT `fk_transaction_accountID_account_id_fk` FOREIGN KEY (`accountID`) REFERENCES `account`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_transaction_categoryID_category_id_fk` FOREIGN KEY (`categoryID`) REFERENCES `category`(`id`),
	CONSTRAINT `fk_transaction_userID_user_id_fk` FOREIGN KEY (`userID`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`verification_token` text
);
