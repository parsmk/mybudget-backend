import { check, numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { uuidPK } from "../utils/models";
import { userSchema } from "./user";
import { sql } from "drizzle-orm";

export const ACCOUNT_TYPES = ["chequing", "credit", "cash"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const accountSchema = sqliteTable(
  "account",
  {
    id: uuidPK(),
    number: text().notNull().unique(),
    name: text(),
    institution: text().notNull(),
    balance: numeric().notNull(),
    type: text().$type<AccountType>().notNull(),
    userID: text()
      .notNull()
      .references(() => userSchema.id),
  },
  (table) => [
    check(
      "account_type_check",
      sql`${table.type} in (${sql.join(
        ACCOUNT_TYPES.map((t) => sql.raw(`'${t}'`)),
        sql`, `,
      )})`,
    ),
  ],
);
