import { Router } from "express";
import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccounts,
  patchAccount,
} from "../models/account";
import { transactionRouter } from "./transactionRoutes";

export const accountRouter = Router();

accountRouter.post("/", async (req, res) => {
  try {
    const { name, balance, type } = req.body;

    if (!(name && Number(balance ?? 0) > 0 && type))
      return res.status(400).json({
        error: `Missing or invalid required properties: {number, balance, and type}`,
      });

    const account = await createAccount({
      name,
      balance,
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
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get<{ id: string }>("/:id", async (req, res) => {
  try {
    const account = await getAccount(req.params.id, req.auth?.id!);

    if (!account) return res.status(404).json({ error: "Account not found" });
    else return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.patch<{ id: string }>("/:id", async (req, res) => {
  try {
    const { name, balance, type } = req.body;

    const account = await patchAccount(req.params.id, req.auth?.id!, {
      name,
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

accountRouter.delete<{ id: string }>("/:id", async (req, res) => {
  try {
    const account = await deleteAccount(req.params.id, req.auth?.id!);

    if (!account) return res.status(404).json({ error: "Account not found" });
    return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});
