import { Router } from "express";
import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccounts,
  patchAccount,
} from "../models/account";
import {
  aggregateTransactionsByCategory,
  getTransactions,
} from "../models/transaction";

export const accountRouter = Router();

accountRouter.post("/", async (req, res) => {
  try {
    const { name, balance, type } = req.body;

    if (!(name && Number(balance ?? 0) >= 0 && type))
      return res.status(400).json({
        error: `Missing or invalid required properties: {number, balance, and type}`,
      });

    const account = await createAccount({
      name,
      cent_balance: Math.round(Number(balance) * 100),
      type,
      userID: req.auth?.id!,
    });

    return res.status(201).json(account);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get("/", async (req, res) => {
  try {
    const accounts = await getAccounts(req.auth?.id!);
    return res.status(200).json(accounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get<{ id: string }>("/:id", async (req, res) => {
  try {
    const account = await getAccount(req.params.id, req.auth?.id!);

    if (!account) return res.status(404).json({ error: "Account not found" });
    else return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get<{ id: string }>("/:id/transactions", async (req, res) => {
  try {
    const transactions = await getTransactions(req.auth?.id!, req.params.id);
    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get<{ id: string }>("/:id/analytics", async (req, res) => {
  try {
    const from =
      typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;

    const sumByCategory = await aggregateTransactionsByCategory(
      req.auth?.id!,
      req.params.id,
      from,
      to,
    );

    const total = sumByCategory.reduce(
      (acc, c) => acc + Number(c.amount ?? 0),
      0,
    );

    const output = sumByCategory.map((cat) => {
      const amount = Number(cat.amount ?? 0);
      return {
        category: cat.category,
        amount,
        pct: +(total > 0 ? amount / total : 0).toFixed(2),
      };
    });

    return res.status(200).json(output);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.patch<{ id: string }>("/:id", async (req, res) => {
  try {
    const { name, balance, type } = req.body;

    const account = await patchAccount(req.params.id, req.auth?.id!, {
      name,
      cent_balance: balance ? Math.round(Number(balance) * 100) : undefined,
      type,
    });

    if (!account) return res.status(404).json({ error: "Account not found" });
    else return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.delete<{ id: string }>("/:id", async (req, res) => {
  try {
    const account = await deleteAccount(req.params.id, req.auth?.id!);

    if (!account) return res.status(404).json({ error: "Account not found" });
    return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});
