import { sql, eq, and } from "drizzle-orm";
import { AccountInsert, accountSchema } from "../models/account";
import { db } from "../services";
import { SQLExecutables } from "../utils/models";

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
