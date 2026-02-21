import { Router } from "express";
import { z as zod } from "zod";
import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccounts,
  patchAccount,
} from "../queries/accountQueries";
import {
  aggregateTransactionsByCategory,
  getTransactions,
} from "../queries/transactionQueries";
import {
  AccountInsert,
  accountInsertSchema,
  bulkAccountSelectSchema,
  accountUpdateSchema,
  accountSelectSchema,
} from "../models/account";
import { bulkTransactionSelectSchema } from "../models/transaction";
import { formatCreateResponse } from "../utils/routes";

export const accountRouter = Router();

accountRouter.post("/", async (req, res) => {
  try {
    if (!req.body)
      return res.status(400).json({ error: "No accounts supplied" });

    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const accounts: AccountInsert[] = [];
    const errs = [];
    for (const dp of payload) {
      const parsed = accountInsertSchema.safeParse({
        name: dp.name,
        cent_balance: Math.round(Number(dp.balance) * 100),
        type: dp.type,
      });

      if (!parsed.success) {
        errs.push(zod.flattenError(parsed.error));
        continue;
      }

      const { name, cent_balance, type } = parsed.data;

      accounts.push({
        name,
        cent_balance,
        type,
        userID: req.auth?.id!,
      });
    }

    const uploaded = await createAccount(accounts);

    const [status, response] = formatCreateResponse(
      bulkAccountSelectSchema.parse(uploaded),
      errs,
    );
    return res.status(status).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get("/", async (req, res) => {
  try {
    const accounts = await getAccounts(req.auth?.id!);
    return res.status(200).json(bulkAccountSelectSchema.parse(accounts));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get<{ id: string }>("/:id", async (req, res) => {
  try {
    const account = await getAccount(req.params.id, req.auth?.id!);
    if (!account) return res.status(404).json({ error: "Account not found" });
    else return res.status(200).json(accountSelectSchema.parse(account));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get<{ id: string }>("/:id/transactions", async (req, res) => {
  try {
    const from =
      typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;

    const transactions = await getTransactions(
      req.auth?.id!,
      req.params.id,
      undefined,
      from,
      to,
    );

    return res
      .status(200)
      .json(bulkTransactionSelectSchema.parse(transactions));
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
    const parsed = accountUpdateSchema.safeParse({
      name: req.body.name,
      cent_balance: req.body.balance
        ? Math.round(Number(req.body.balance) * 100)
        : undefined,
      type: req.body.type,
    });

    if (!parsed.success)
      return res.status(400).json(zod.flattenError(parsed.error));

    const { name, cent_balance, type } = parsed.data;

    const account = await patchAccount(req.params.id, req.auth?.id!, {
      name,
      cent_balance,
      type,
    });

    if (!account) return res.status(404).json({ error: "Account not found" });
    else return res.status(200).json(accountSelectSchema.parse(account));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.delete<{ id: string }>("/:id", async (req, res) => {
  try {
    const account = await deleteAccount(req.params.id, req.auth?.id!);

    if (!account) return res.status(404).json({ error: "Account not found" });
    return res.status(200).json(accountSelectSchema.parse(account));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});
