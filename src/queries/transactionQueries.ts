import { gte, lt, eq, and, sql, inArray } from "drizzle-orm";
import { updateBalance } from "./accountQueries";
import { categorySchema } from "../models/category";
import {
  TransactionInsert,
  transactionOutputSchema,
  transactionSchema,
} from "../models/transaction";
import { db } from "../services";
import {
  SQLExecutables,
  returnSignedInflowOrOutflow,
  queryBuilder,
} from "../utils/models";

export const createTransactions = async (
  payload: TransactionInsert[] | TransactionInsert,
  executable: SQLExecutables = db,
) => {
  const transactions = await executable.transaction(async (atomic) => {
    const inserted = await atomic
      .insert(transactionSchema)
      .values(Array.isArray(payload) ? payload : [payload])
      .returning(transactionOutputSchema);

    await updateBalance(
      inserted[0].account_id,
      inserted[0].user_id,
      inserted.reduce(
        (acc, tr) =>
          (acc += returnSignedInflowOrOutflow(tr.cent_inflow, tr.cent_outflow)),
        0,
      ),
      atomic,
    );

    return inserted;
  });

  return transactions;
};

export const getTransactions = async (
  userID: string,
  accountID?: string,
  executable: SQLExecutables = db,
  from?: string,
  to?: string,
) => {
  const filterFrom = from ? gte(transactionSchema.date, from) : null;
  const filterTo = to ? lt(transactionSchema.date, to) : null;
  const confirmUser = eq(transactionSchema.user_id, userID);
  const filterAccount = accountID
    ? eq(transactionSchema.account_id, accountID)
    : null;

  const transactions = await executable
    .select({
      ...transactionOutputSchema,
      category: categorySchema,
    })
    .from(transactionSchema)
    .leftJoin(
      categorySchema,
      eq(transactionSchema.category_id, categorySchema.id),
    )
    .where(
      queryBuilder("and", confirmUser, filterAccount, filterFrom, filterTo),
    );

  return transactions;
};

export const getTransaction = async (
  userID: string,
  id: string,
  executable: SQLExecutables = db,
) => {
  const transaction = (
    await executable
      .select(transactionOutputSchema)
      .from(transactionSchema)
      .where(
        and(
          eq(transactionSchema.user_id, userID),
          eq(transactionSchema.id, id),
        ),
      )
  )[0];

  return transaction;
};

export const aggregateTransactionsByCategory = async (
  userID: string,
  accountID?: string,
  from?: string,
  to?: string,
  executable: SQLExecutables = db,
) => {
  const confirmUser = eq(transactionSchema.user_id, userID);
  const filterFrom = from ? gte(transactionSchema.date, from) : null;
  const filterTo = to ? lt(transactionSchema.date, to) : null;
  const filterAccount = accountID
    ? eq(transactionSchema.account_id, accountID)
    : null;

  const rows = await executable
    .select({
      category: {
        id: categorySchema.id,
        name: categorySchema.name,
      },
      amount: sql<number>`sum(coalesce(${transactionSchema.cent_outflow}, 0)) / 100.0`,
    })
    .from(transactionSchema)
    .leftJoin(
      categorySchema,
      eq(transactionSchema.category_id, categorySchema.id),
    )
    .where(
      queryBuilder("and", confirmUser, filterFrom, filterTo, filterAccount),
    )
    .groupBy(categorySchema.id, categorySchema.name);

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

    const nextAccount = updates.account_id ?? originalTransaction.account_id;
    const nextInflow = updates.cent_inflow ?? originalTransaction.cent_inflow;
    const nextOutflow =
      updates.cent_outflow ?? originalTransaction.cent_outflow;

    if (Number(nextInflow ?? 0) > 0 === Number(nextOutflow ?? 0) > 0) {
      throw new Error(
        "Transaction must have exactly one positive inflow or outflow",
      );
    }

    const oldDelta = returnSignedInflowOrOutflow(
      originalTransaction.cent_inflow,
      originalTransaction.cent_outflow,
    );
    const nextDelta = returnSignedInflowOrOutflow(nextInflow, nextOutflow);

    const patch = {
      ...updates,
      accountID: nextAccount,
      cent_inflow: nextInflow,
      cent_outflow: nextOutflow,
    };

    if (nextAccount === originalTransaction.account_id) {
      await updateBalance(nextAccount, userID, nextDelta - oldDelta, atomic);
    } else {
      await updateBalance(
        originalTransaction.account_id,
        userID,
        -oldDelta,
        atomic,
      );
      await updateBalance(nextAccount, userID, nextDelta, atomic);
    }

    return (
      await atomic
        .update(transactionSchema)
        .set(patch)
        .where(
          and(
            eq(transactionSchema.id, transactionID),
            eq(transactionSchema.user_id, userID),
          ),
        )
        .returning(transactionOutputSchema)
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
            eq(transactionSchema.user_id, userID),
          ),
        )
        .returning(transactionOutputSchema)
    )[0];

    await updateBalance(
      transaction.account_id,
      userID,
      -returnSignedInflowOrOutflow(
        transaction.cent_inflow,
        transaction.cent_outflow,
      ),
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
          eq(transactionSchema.user_id, userID),
          inArray(transactionSchema.id, transactionIDs),
        ),
      )
      .returning(transactionOutputSchema);

    if (transactions.length === 0) return null;

    const perAccount = new Map<string, number>();

    for (const t of transactions) {
      const delta = returnSignedInflowOrOutflow(t.cent_inflow, t.cent_outflow);
      perAccount.set(t.account_id, (perAccount.get(t.account_id) ?? 0) + delta);
    }

    for (const [accountID, sumDelta] of perAccount) {
      await updateBalance(accountID, userID, -sumDelta, atomic);
    }

    return transactions;
  });
};
