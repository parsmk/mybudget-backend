import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";
import { db } from "../db";
import { transactionSchema } from "../models/transaction";

export const transactionRouter = Router();

transactionRouter.post("/create", ensureAuth, async (req, res) => {
  try {
    const payload = req.body;
    const user = req.auth;

    const transactions = payload.map((t: any) => ({ ...t, userID: user?.id }));

    const uploaded = await db
      .insert(transactionSchema)
      .values(transactions)
      .returning();

    return res.status(201).json({ transactions: uploaded });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ create_transactions: "Internal Server error!" });
  }
});

transactionRouter.get("/", ensureAuth, async (req, res) => {});
