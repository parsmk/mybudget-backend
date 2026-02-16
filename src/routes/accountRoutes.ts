import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";
import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccounts,
  patchAccount,
} from "../models/account";

export const accountRouter = Router();

accountRouter.post("/", ensureAuth, async (req, res) => {
  try {
    const { number, name, institution, balance, type } = req.body;

    if (!(number && institution && balance && type))
      return res.status(400).json({
        error: `Missing required properties: {number, institution, balance, and type}`,
      });

    const account = await createAccount({
      number,
      name,
      institution,
      balance,
      type,
      userID: req.auth?.id!,
    });

    return res.status(201).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get("/", ensureAuth, async (req, res) => {
  try {
    const accounts = getAccounts(req.auth?.id!);
    return res.status(200).json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const account = await getAccount(req.params.id, req.auth?.id!);

    if (!account) return res.status(404).json({ error: "Account not found" });
    else return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.patch<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const { number, name, institution, balance, type } = req.body;

    const account = await patchAccount(req.params.id, req.auth?.id!, {
      number,
      name,
      institution,
      balance,
      type,
    });

    if (!account) return res.status(404).json({ error: "Account not found" });
    else return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.delete<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const account = deleteAccount(req.params.id, req.auth?.id!);

    if (!account) return res.status(404).json({ error: "Account not found" });
    return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});
