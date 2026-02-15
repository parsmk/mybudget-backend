import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";
import { db } from "../db";
import { accountSchema } from "../models/account";
import { and, eq } from "drizzle-orm";

export const accountRouter = Router();

accountRouter.post("/", ensureAuth, async (req, res) => {
  try {
    const { number, name, institution, balance, type } = req.body;

    if (!(number && institution && balance && type))
      return res.status(400).json({
        error: `Missing required properties: {number, institution, balance, and type}`,
      });

    const account = await db
      .insert(accountSchema)
      .values({
        number,
        name,
        institution,
        balance,
        type,
        userID: req.auth?.id!,
      })
      .returning();

    return res.status(201).json(account[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get("/", ensureAuth, async (req, res) => {
  try {
    const accounts = await db
      .select()
      .from(accountSchema)
      .where(eq(accountSchema.userID, req.auth?.id!));

    return res.status(200).json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.get<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const id = req.params.id;

    const account = await db
      .select()
      .from(accountSchema)
      .where(
        and(eq(accountSchema.userID, req.auth?.id!), eq(accountSchema.id, id)),
      );

    if (account.length < 1)
      return res.status(404).json({ error: "Account not found" });

    return res.status(200).json(account[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.patch<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { number, name, institution, balance, type } = req.body;

    const account = await db
      .update(accountSchema)
      .set({
        number,
        name,
        institution,
        balance,
        type,
      })
      .where(
        and(eq(accountSchema.userID, req.auth?.id!), eq(accountSchema.id, id)),
      )
      .returning();

    return res.status(200).json(account[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

accountRouter.delete<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const id = req.params.id;

    const account = await db
      .delete(accountSchema)
      .where(
        and(eq(accountSchema.userID, req.auth?.id!), eq(accountSchema.id, id)),
      )
      .returning();

    return res.status(200).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});
