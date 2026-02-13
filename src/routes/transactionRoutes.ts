import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";
import { db } from "../db";
import { transactionSchema } from "../models/transaction";
import { eq } from "drizzle-orm";

export const transactionRouter = Router();

transactionRouter.post("/create", ensureAuth, async (req, res) => {
  try {
    const payload = req.body;
    const user = req.auth;
    if (!user) return;

    const transactions = payload.map((t: any) => ({ ...t, userID: user.id }));

    const uploaded = await db
      .insert(transactionSchema)
      .values(transactions)
      .returning();

    return res.status(201).json(uploaded);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ create_transactions: "Internal server error!" });
  }
});

transactionRouter.get("/", ensureAuth, async (req, res) => {
  try {
    const user = req.auth;
    if (!user) return;

    const transactions = await db
      .select()
      .from(transactionSchema)
      .where(eq(transactionSchema.userID, user.id));

    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ get_transactions: "Internal server error!" });
  }
});
