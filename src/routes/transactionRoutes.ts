import { Router } from "express";
import {
  TransactionInsert,
  createTransactions,
  getTransactions,
  patchTransaction,
  deleteTransaction,
  deleteTransactions,
} from "../models/transaction";
import { returnSignedInflowOrOutflow } from "../utils/models";

export const transactionRouter = Router();

transactionRouter.post("/", async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (payload.length < 1)
      return res.status(400).json({ error: "No transactions supplied" });

    const errs: string[] = [];
    const transactions: TransactionInsert[] = [];
    let balanceChange = 0;

    for (const dp of payload) {
      if (Number(dp.inflow ?? 0) <= 0 && Number(dp.outflow ?? 0) <= 0) {
        errs.push("Transactions must have either inflow or outflow");
        continue;
      }
      if (!(dp.date && dp.payee && dp.accountID)) {
        errs.push("Missing required properties: {date, payee, account}");
        continue;
      }

      transactions.push({
        date: new Date(dp.date).toISOString(),
        inflow: dp.inflow,
        outflow: dp.outflow,
        payee: dp.payee,
        accountID: dp.accountID,
        categoryID: dp.categoryID,
        userID: req.auth?.id!,
      });

      balanceChange += returnSignedInflowOrOutflow(dp.inflow, dp.outflow);
    }

    const uploaded = await createTransactions(transactions, balanceChange);

    if (uploaded.length === 0 && errs.length > 0) {
      return res.status(400).json({
        errors: { count: errs.length, reasons: errs },
        success: { count: 0, uploaded: [] },
      });
    }

    if (uploaded.length > 0 && errs.length > 0) {
      return res.status(200).json({
        errors: { count: errs.length, reasons: errs },
        success: { count: uploaded.length, uploaded },
      });
    }

    return res.status(201).json({
      errors: { count: 0, reasons: [] },
      success: { count: uploaded.length, uploaded },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

transactionRouter.get("/", async (req, res) => {
  try {
    const transactions = await getTransactions(req.auth?.id!);
    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

transactionRouter.patch<{ id: string }>("/:id", async (req, res) => {
  try {
    const { date, payee, accountID, inflow, outflow, categoryID } = req.body;

    const transaction = await patchTransaction(req.params.id, req.auth?.id!, {
      date,
      payee,
      accountID,
      inflow,
      outflow,
      categoryID,
    });

    if (!transaction)
      return res.status(404).json({ error: "Could not find transaction" });

    return res.status(200).json(transaction);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

transactionRouter.delete("/", async (req, res) => {
  try {
    const ids = req.body;
    if (!ids || !Array.isArray(ids))
      return res.status(400).json({
        error: "Use DELETE transactions/{id} to delete 1 transaction",
      });
    const transactions = await deleteTransactions(ids, req.auth?.id!);

    if (!transactions)
      return res.status(404).json({ error: "Could not find any transactions" });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

transactionRouter.delete<{ id: string }>("/:id", async (req, res) => {
  try {
    const transaction = await deleteTransaction(req.params.id, req.auth?.id!);

    if (!transaction)
      return res.status(404).json({ error: "Could not find transaction" });
    else return res.status(200).json(transaction);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});
