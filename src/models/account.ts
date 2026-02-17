import { check, numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel, sql, and, eq } from "drizzle-orm";
import { uuidPK } from "../utils/models";
import { userSchema } from "./user";
import { db } from "../db";

export const ACCOUNT_TYPES = ["chequing", "credit", "cash"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const accountSchema = sqliteTable(
  "account",
  {
    id: uuidPK(),
    name: text().notNull(),
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

export type AccountInsert = InferInsertModel<typeof accountSchema>;
export type Account = InferSelectModel<typeof accountSchema>;

export const createAccount = async (account: AccountInsert) => {
  return (
    await db
      .insert(accountSchema)
      .values({
        name: account.name,
        balance: account.balance,
        type: account.type,
        userID: account.userID,
      })
      .returning()
  )[0];
};

export const getAccounts = async (userID: string) => {
  return await db
    .select()
    .from(accountSchema)
    .where(eq(accountSchema.userID, userID));
};

export const getAccount = async (accountID: string, userID: string) => {
  return (
    await db
      .select()
      .from(accountSchema)
      .where(
        and(eq(accountSchema.userID, userID), eq(accountSchema.id, accountID)),
      )
  )[0];
};

export const patchAccount = async (
  accountID: string,
  userID: string,
  updates: Partial<Omit<AccountInsert, "id" | "userID">>,
) => {
  return (
    await db
      .update(accountSchema)
      .set(updates)
      .where(
        and(eq(accountSchema.userID, userID), eq(accountSchema.id, accountID)),
      )
      .returning()
  )[0];
};

export const deleteAccount = async (accountID: string, userID: string) => {
  return (
    await db
      .delete(accountSchema)
      .where(
        and(eq(accountSchema.userID, userID), eq(accountSchema.id, accountID)),
      )
      .returning()
  )[0];
};
