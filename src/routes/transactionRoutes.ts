import { Router } from "express";
import {
  TransactionInsert,
  createTransactions,
  getTransactions,
  patchTransaction,
  deleteTransaction,
  deleteTransactions,
} from "../models/transaction";

export const transactionRouter = Router();

transactionRouter.post("/", async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    // YYYY {4 digits} - MM {01...09 | 11 12} - DD {01...09 | (1|2)0...(1|2)9 | 30 31}
    const dateTest = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    if (payload.length < 1)
      return res.status(400).json({ error: "No transactions supplied" });

    const errs: string[] = [];
    const transactions: TransactionInsert[] = [];

    for (const dp of payload) {
      const inflow = Number(dp.inflow ?? 0);
      const outflow = Number(dp.outflow ?? 0);
      if (Number.isNaN(inflow) || Number.isNaN(outflow)) {
        errs.push("Inflow and outflow must be valid numbers");
        continue;
      }
      if (inflow > 0 === outflow > 0) {
        errs.push(
          "Transaction must have exactly one positive inflow or outflow",
        );
        continue;
      }
      if (!(dp.date.trim() && dp.payee.trim() && dp.accountID)) {
        errs.push("Missing required properties: {date, payee, account}");
        continue;
      }
      if (!dateTest.test(dp.date)) {
        errs.push("Dates must be in YYYY-MM-DD format");
        continue;
      }

      transactions.push({
        date: dp.date,
        cent_inflow: Math.round(inflow * 100),
        cent_outflow: Math.round(outflow * 100),
        payee: dp.payee,
        accountID: dp.accountID,
        categoryID: dp.categoryID,
        userID: req.auth?.id!,
      });
    }

    const uploaded = await createTransactions(transactions);

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
      cent_inflow: inflow ? Math.round(Number(inflow) * 100) : undefined,
      cent_outflow: outflow ? Math.round(Number(outflow) * 100) : undefined,
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
