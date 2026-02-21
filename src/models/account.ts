import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { uuidPK } from "../utils/models";
import { userSchema } from "./user";

export const ACCOUNT_TYPES = ["chequing", "credit", "cash"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const accountSchema = sqliteTable(
  "account",
  {
    id: uuidPK(),
    name: text().notNull(),
    cent_balance: integer().notNull(),
    type: text().$type<AccountType>().notNull(),
    userID: text()
      .notNull()
      .references(() => userSchema.id, { onDelete: "cascade" }),
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

export type AccountInsert = InferInsertModel<typeof accountSchema>;
export type AccountSelect = InferSelectModel<typeof accountSchema>;
