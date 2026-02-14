import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";
import { db } from "../db";
import { transactionSchema } from "../models/transaction";
import { eq } from "drizzle-orm";

export const transactionRouter = Router();

transactionRouter.post("/", ensureAuth, async (req, res) => {
  try {
    const payload = req.body;
    const transactions = payload.map((t: any) => ({
      ...t,
      userID: req.auth?.id!,
    }));

    const uploaded = await db
      .insert(transactionSchema)
      .values(transactions)
      .returning();

    return res.status(201).json(uploaded);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error!" });
  }
});

transactionRouter.get("/", ensureAuth, async (req, res) => {
  try {
    const transactions = await db
      .select()
      .from(transactionSchema)
      .where(eq(transactionSchema.userID, req.auth?.id!));

    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error!" });
  }
});
