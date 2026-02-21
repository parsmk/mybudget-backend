import { sql, eq, and } from "drizzle-orm";
import {
  AccountInsert,
  accountOutputSchema,
  accountSchema,
} from "../models/account";
import { db } from "../services";
import { SQLExecutables } from "../utils/models";

export const createAccount = async (
  account: AccountInsert[] | AccountInsert,
  executable: SQLExecutables = db,
) => {
  return await executable
    .insert(accountSchema)
    .values(Array.isArray(account) ? account : [account])
    .returning(accountOutputSchema);
};

export const getAccounts = async (
  userID: string,
  executable: SQLExecutables = db,
) => {
  return await executable
    .select(accountOutputSchema)
    .from(accountSchema)
    .where(eq(accountSchema.userID, userID));
};

export const getAccount = async (
  accountID: string,
  userID: string,
  executable: SQLExecutables = db,
) => {
  return (
    await executable
      .select(accountOutputSchema)
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
  executable: SQLExecutables = db,
) => {
  return (
    await executable
      .update(accountSchema)
      .set(updates)
      .where(
        and(eq(accountSchema.userID, userID), eq(accountSchema.id, accountID)),
      )
      .returning(accountOutputSchema)
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
      .returning(accountOutputSchema)
  )[0];
};
