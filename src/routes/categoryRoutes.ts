import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";
import { db } from "../db";
import { categorySchema } from "../models/transaction";
import { eq } from "drizzle-orm";

export const categoryRouter = Router();

categoryRouter.post("/", ensureAuth, async (req, res) => {
  try {
    const { name } = req.body;

    const newCategory = await db
      .insert(categorySchema)
      .values({ name: name, userID: req.auth?.id! })
      .returning();

    return res.status(204).json(newCategory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.get("/", ensureAuth, async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(categorySchema)
      .where(eq(categorySchema.userID, req.auth?.id!));

    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.patch<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { name } = req.body;

    const category = await db
      .update(categorySchema)
      .set({ name: name })
      .where(eq(categorySchema.id, id))
      .returning();

    return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});
