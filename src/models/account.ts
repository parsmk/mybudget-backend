import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel, sql, and, eq } from "drizzle-orm";
import { SQLExecutables, uuidPK } from "../utils/models";
import { userSchema } from "./user";
import { db } from "../db";

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

export const createAccount = async (
  account: AccountInsert,
  executable: SQLExecutables = db,
) => {
  return (
    await executable
      .insert(accountSchema)
      .values({
        name: account.name,
        cent_balance: account.cent_balance,
        type: account.type,
        userID: account.userID,
      })
      .returning()
  )[0];
};

export const getAccounts = async (
  userID: string,
  executable: SQLExecutables = db,
) => {
  const accounts = await executable
    .select({
      account: accountSchema,
      balance: sql<number>`${accountSchema.cent_balance} / 100.0`,
    })
    .from(accountSchema)
    .where(eq(accountSchema.userID, userID));

  return accounts.map(({ account, balance }) => ({ ...account, balance }));
};

export const getAccount = async (
  accountID: string,
  userID: string,
  executable: SQLExecutables = db,
) => {
  const account = (
    await executable
      .select({
        account: accountSchema,
        balance: sql<number>`${accountSchema.cent_balance} / 100.0`,
      })
      .from(accountSchema)
      .where(
        and(eq(accountSchema.userID, userID), eq(accountSchema.id, accountID)),
      )
  )[0];

  return { ...account.account, balance: account.balance };
};

export const patchAccount = async (
  accountID: string,
  userID: string,
  updates: Partial<Omit<AccountInsert, "id" | "userID">>,
  executable: SQLExecutables = db,
) => {
  return (
    await executable
      .update(accountSchema)
      .set(updates)
      .where(
        and(eq(accountSchema.userID, userID), eq(accountSchema.id, accountID)),
      )
      .returning()
  )[0];
};

export const updateBalance = async (
  accountID: string,
  userID: string,
  balanceChange: number,
  executable: SQLExecutables = db,
) => {
  if (!balanceChange) return;
  return await executable
    .update(accountSchema)
    .set({
      cent_balance: sql`${accountSchema.cent_balance} + ${balanceChange}`,
    })
    .where(
      and(eq(accountSchema.id, accountID), eq(accountSchema.userID, userID)),
    );
};

export const deleteAccount = async (
  accountID: string,
  userID: string,
  executable: SQLExecutables = db,
) => {
  return (
    await executable
      .delete(accountSchema)
      .where(
        and(eq(accountSchema.userID, userID), eq(accountSchema.id, accountID)),
      )
      .returning()
  )[0];
};
