import { numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  InferInsertModel,
  InferSelectModel,
  and,
  eq,
  gte,
  inArray,
  lt,
  sql,
} from "drizzle-orm";
import {
  queryBuilder,
  uuidPK,
  returnSignedInflowOrOutflow,
  SQLExecutables,
} from "../utils/models";
import { userSchema } from "./user";
import { categorySchema } from "./category";
import { accountSchema, updateBalance } from "./account";
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

export const createTransactions = async (
  payload: TransactionInsert[],
  executable: SQLExecutables = db,
) => {
  return await executable.transaction(async (atomic) => {
    const transactions = await atomic
      .insert(transactionSchema)
      .values(payload)
      .returning();

    await updateBalance(
      payload[0].accountID,
      payload[0].userID,
      transactions.reduce(
        (acc, tr) =>
          (acc += returnSignedInflowOrOutflow(tr.inflow, tr.outflow)),
        0,
      ),
      atomic,
    );

    return transactions;
  });
};

export const getTransactions = async (
  userID: string,
  accountID?: string,
  executable: SQLExecutables = db,
) => {
  const confirmUser = eq(transactionSchema.userID, userID);
  const filterAccount = accountID
    ? eq(transactionSchema.accountID, accountID)
    : null;

  const rows = await executable
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

export const getTransaction = async (
  userID: string,
  id: string,
  executable: SQLExecutables = db,
) => {
  return (
    await executable
      .select()
      .from(transactionSchema)
      .where(
        and(eq(transactionSchema.userID, userID), eq(transactionSchema.id, id)),
      )
  )[0];
};

export const aggregateTransactionsByCategory = async (
  userID: string,
  accountID?: string,
  from?: string,
  to?: string,
  executable: SQLExecutables = db,
) => {
  const confirmUser = eq(transactionSchema.userID, userID);
  const filterFrom = from ? gte(transactionSchema.date, from) : null;
  const filterTo = to ? lt(transactionSchema.date, to) : null;
  const filterAccount = accountID
    ? eq(transactionSchema.accountID, accountID)
    : null;

  const rows = await executable
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
  executable: SQLExecutables = db,
) => {
  return await executable.transaction(async (atomic) => {
    const originalTransaction = await getTransaction(
      userID,
      transactionID,
      atomic,
    );

    if (!originalTransaction) return null;

    const account = updates.accountID ?? originalTransaction.accountID;
    const oldDelta = returnSignedInflowOrOutflow(
      originalTransaction.inflow,
      originalTransaction.outflow,
    );
    const newDelta = returnSignedInflowOrOutflow(
      updates.inflow ?? originalTransaction.inflow,
      updates.outflow ?? originalTransaction.outflow,
    );

    if (account === originalTransaction.accountID) {
      await updateBalance(account, userID, newDelta - oldDelta, atomic);
    } else {
      await updateBalance(
        originalTransaction.accountID,
        userID,
        -oldDelta,
        atomic,
      );
      await updateBalance(account, userID, newDelta, atomic);
    }

    return (
      await atomic
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
  });
};

export const deleteTransaction = async (
  transactionID: string,
  userID: string,
  executable: SQLExecutables = db,
) => {
  return await executable.transaction(async (atomic) => {
    const transaction = (
      await atomic
        .delete(transactionSchema)
        .where(
          and(
            eq(transactionSchema.id, transactionID),
            eq(transactionSchema.userID, userID),
          ),
        )
        .returning()
    )[0];

    await updateBalance(
      transaction.accountID,
      userID,
      -returnSignedInflowOrOutflow(transaction.inflow, transaction.outflow),
      atomic,
    );

    return transaction;
  });
};

export const deleteTransactions = async (
  transactionIDs: string[],
  userID: string,
  executable: SQLExecutables = db,
) => {
  return await executable.transaction(async (atomic) => {
    const transactions = await atomic
      .delete(transactionSchema)
      .where(
        and(
          eq(transactionSchema.userID, userID),
          inArray(transactionSchema.id, transactionIDs),
        ),
      )
      .returning();

    if (transactions.length === 0) return null;

    const perAccount = new Map<string, number>();

    for (const t of transactions) {
      const delta = returnSignedInflowOrOutflow(t.inflow, t.outflow);
      perAccount.set(t.accountID, (perAccount.get(t.accountID) ?? 0) + delta);
    }

    for (const [accountID, sumDelta] of perAccount) {
      await updateBalance(accountID, userID, -sumDelta, atomic);
    }

    return transactions;
  });
};
