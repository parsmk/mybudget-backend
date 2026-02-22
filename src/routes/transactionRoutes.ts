import { Router } from "express";
import { z as zod } from "zod";
import {
  createTransactions,
  getTransactions,
  patchTransaction,
  deleteTransaction,
  deleteTransactions,
} from "../queries/transactionQueries";
import {
  bulkTransactionInsertSchema,
  bulkTransactionSelectSchema,
  TransactionInsert,
  transactionInsertSchema,
  TransactionSelect,
  transactionSelectSchema,
  transactionUpdateSchema,
} from "../models/transaction";
import { formatCreateResponse, formatErrorResponse } from "../utils/routes";
import { dateField } from "../utils/models";

export const transactionRouter = Router();

transactionRouter.post("/", async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (!payload || payload.length < 1)
      return res
        .status(400)
        .json(formatErrorResponse("No transactions supplied"));

    const errs = [];
    const transactions: TransactionInsert[] = [];

    for (const dp of payload) {
      const parsed = transactionInsertSchema.safeParse(dp);

      if (!parsed.success) {
        errs.push(zod.flattenError(parsed.error));
        continue;
      }

      const {
        date,
        payee,
        account_id: accountID,
        category_id: categoryID,
        inflow,
        outflow,
      } = parsed.data;

      transactions.push({
        date,
        cent_inflow: inflow ? Math.round(inflow * 100) : undefined,
        cent_outflow: outflow ? Math.round(outflow * 100) : undefined,
        payee,
        account_id: accountID,
        category_id: categoryID,
        user_id: req.auth?.id!,
      });
    }

    let uploaded: TransactionSelect[] = [];
    if (transactions.length > 0)
      uploaded = await createTransactions(transactions);

    const [status, response] = formatCreateResponse(
      bulkTransactionInsertSchema.parse(uploaded),
      errs,
    );
    return res.status(status).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Internal error"));
  }
});

transactionRouter.get("/", async (req, res) => {
  try {
    const rawFrom =
      typeof req.query.from === "string" ? req.query.from : undefined;
    const rawTo = typeof req.query.to === "string" ? req.query.to : undefined;

    const from = rawFrom ? dateField.safeParse(rawFrom) : undefined;
    const to = rawTo ? dateField.safeParse(rawTo) : undefined;

    if (from && !from.success)
      return res.status(400).json(formatErrorResponse("Invalid from query"));

    if (to && !to.success)
      return res.status(400).json(formatErrorResponse("Invalid to query"));

    const transactions = await getTransactions(
      req.auth?.id!,
      undefined,
      undefined,
      from?.data,
      to?.data,
    );

    return res
      .status(200)
      .json(bulkTransactionSelectSchema.parse(transactions));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Internal error"));
  }
});

transactionRouter.patch<{ id: string }>("/:id", async (req, res) => {
  try {
    const parsed = transactionUpdateSchema.safeParse(req.body);

    if (!parsed.success)
      return res.status(400).json(zod.flattenError(parsed.error));

    const {
      date,
      payee,
      account_id: accountID,
      inflow,
      outflow,
      category_id: categoryID,
    } = parsed.data;

    const transaction = await patchTransaction(req.params.id, req.auth?.id!, {
      date,
      payee,
      account_id: accountID,
      cent_inflow: inflow ? Math.round(Number(inflow) * 100) : undefined,
      cent_outflow: outflow ? Math.round(Number(outflow) * 100) : undefined,
      category_id: categoryID,
    });

    if (!transaction)
      return res
        .status(404)
        .json(formatErrorResponse("Could not find transaction"));

    return res.status(200).json(transactionSelectSchema.parse(transaction));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Internal error"));
  }
});

transactionRouter.delete("/", async (req, res) => {
  try {
    const ids = req.body;

    if (!ids)
      return res
        .status(400)
        .json(formatErrorResponse("Body must contain list of ids"));
    else if (!Array.isArray(ids))
      return res
        .status(400)
        .json(
          formatErrorResponse(
            "Use DELETE transactions/{id} to delete 1 transaction",
          ),
        );

    const transactions = await deleteTransactions(ids, req.auth?.id!);

    if (!transactions)
      return res
        .status(404)
        .json(formatErrorResponse("Could not find any supplied transactions"));

    return res
      .status(200)
      .json(bulkTransactionSelectSchema.parse(transactions));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Internal error"));
  }
});

transactionRouter.delete<{ id: string }>("/:id", async (req, res) => {
  try {
    const transaction = await deleteTransaction(req.params.id, req.auth?.id!);

    if (!transaction)
      return res
        .status(404)
        .json(formatErrorResponse("Could not find transaction"));

    return res.status(200).json(transactionSelectSchema.parse(transaction));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Internal error"));
  }
});
