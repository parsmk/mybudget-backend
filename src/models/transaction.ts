import { numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  InferInsertModel,
  InferSelectModel,
  and,
  eq,
  gte,
  lt,
  sql,
} from "drizzle-orm";
import { queryBuilder, uuidPK } from "../utils/models";
import { userSchema } from "./user";
import { categorySchema } from "./category";
import { accountSchema } from "./account";
import { db } from "../db";

export const transactionSchema = sqliteTable("transaction", {
  id: uuidPK(),
  date: text().notNull(),
  inflow: numeric(),
  outflow: numeric(),
  payee: text().notNull(),
  accountID: text()
    .notNull()
    .references(() => accountSchema.id),
  categoryID: text().references(() => categorySchema.id),
  userID: text()
    .notNull()
    .references(() => userSchema.id),
});

export type TransactionInsert = InferInsertModel<typeof transactionSchema>;
export type Transaction = InferSelectModel<typeof transactionSchema>;

export const createTransactions = async (transactions: TransactionInsert[]) => {
  return await db.insert(transactionSchema).values(transactions).returning();
};

export const getTransactions = async (userID: string, accountID?: string) => {
  const confirmUser = eq(transactionSchema.userID, userID);
  const filterAccount = accountID
    ? eq(transactionSchema.accountID, accountID)
    : null;

  const rows = await db
    .select({ transaction: transactionSchema, category: categorySchema })
    .from(transactionSchema)
    .leftJoin(
      categorySchema,
      eq(transactionSchema.categoryID, categorySchema.id),
    )
    .where(queryBuilder("and", confirmUser, filterAccount));

  return rows.map(({ transaction, category }) => ({
    ...transaction,
    category,
  }));
};

export const aggregateTransactionsByCategory = async (
  userID: string,
  accountID?: string,
  from?: string,
  to?: string,
) => {
  const confirmUser = eq(transactionSchema.userID, userID);
  const filterFrom = from ? gte(transactionSchema.date, from) : null;
  const filterTo = to ? lt(transactionSchema.date, to) : null;
  const filterAccount = accountID
    ? eq(transactionSchema.accountID, accountID)
    : null;

  const rows = await db
    .select({
      categoryID: transactionSchema.categoryID,
      amount: sql<number>`sum(${transactionSchema.outflow})`,
    })
    .from(transactionSchema)
    .where(
      queryBuilder("and", confirmUser, filterFrom, filterTo, filterAccount),
    )
    .groupBy(transactionSchema.categoryID);

  return rows;
};

export const patchTransaction = async (
  transactionID: string,
  userID: string,
  updates: Partial<Omit<TransactionInsert, "id" | "userID">>,
) => {
  return (
    await db
      .update(transactionSchema)
      .set(updates)
      .where(
        and(
          eq(transactionSchema.id, transactionID),
          eq(transactionSchema.userID, userID),
        ),
      )
      .returning()
  )[0];
};

export const deleteTransaction = async (
  transactionID: string,
  userID: string,
) => {
  return (
    await db
      .delete(transactionSchema)
      .where(
        and(
          eq(transactionSchema.id, transactionID),
          eq(transactionSchema.userID, userID),
        ),
      )
      .returning()
  )[0];
};
