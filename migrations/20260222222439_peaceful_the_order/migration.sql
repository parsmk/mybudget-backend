CREATE TYPE "type" AS ENUM('chequing', 'credit', 'cash');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"cent_balance" integer NOT NULL,
	"type" "type" NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"date" date NOT NULL,
	"cent_inflow" integer,
	"cent_outflow" integer,
	"payee" text NOT NULL,
	"account_id" uuid NOT NULL,
	"category_id" uuid,
	"user_id" uuid NOT NULL,
	CONSTRAINT "txn_one_positive_check" CHECK ((
        ( "cent_inflow" is null ) <> ( "cent_outflow" is null )
      )),
	CONSTRAINT "txn_nonnegative_check" CHECK ((
        ("cent_inflow" is null or "cent_inflow" >= 0)
        and ("cent_outflow" is null or "cent_outflow" >= 0)
      ))
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verification_token" text
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_id_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_id_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id");--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;