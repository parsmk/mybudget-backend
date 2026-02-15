import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";
import { db } from "../db";
import { transactionSchema } from "../models/transaction";
import { and, eq } from "drizzle-orm";
import { categorySchema } from "../models/category";

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
    return res.status(500).json({ error: "Internal error" });
  }
});

transactionRouter.get("/", ensureAuth, async (req, res) => {
  try {
    const rows = await db
      .select({ transaction: transactionSchema, category: categorySchema })
      .from(transactionSchema)
      .leftJoin(
        categorySchema,
        eq(transactionSchema.categoryID, categorySchema.id),
      )
      .where(eq(transactionSchema.userID, req.auth?.id!));

    const transactions = rows.map(({ transaction, category }) => ({
      ...transaction,
      category,
    }));

    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

transactionRouter.patch<{ transactionId: string }>(
  "/:transactionId",
  ensureAuth,
  async (req, res) => {
    try {
      const transactionId = req.params.transactionId;
      const { id, userID, ...rest } = req.body;

      const transaction = await db
        .update(transactionSchema)
        .set(rest)
        .where(
          and(
            eq(transactionSchema.id, transactionId),
            eq(transactionSchema.userID, req.auth?.id!),
          ),
        )
        .returning();

      if (transaction.length < 1)
        return res.status(404).json({ error: "Could not find transaction" });

      return res.status(200).json(transaction[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal error" });
    }
  },
);

transactionRouter.delete<{ id: string }>("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const transaction = await db
      .delete(transactionSchema)
      .where(
        and(
          eq(transactionSchema.id, id),
          eq(transactionSchema.userID, req.auth?.id!),
        ),
      )
      .returning();

    if (transaction.length < 1)
      return res.status(404).json({ error: "Could not find transaction" });

    return res.status(200).json(transaction[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});
