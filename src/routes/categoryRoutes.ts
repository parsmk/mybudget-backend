import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";
import { db } from "../db";
import { categorySchema } from "../models/category";
import { and, eq } from "drizzle-orm";

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
      .where(
        and(
          eq(categorySchema.id, id),
          eq(categorySchema.userID, req.auth?.id!),
        ),
      )
      .returning();

    if (category.length < 1)
      return res.status(400).json({ error: "Could not find category" });

    return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.delete<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const id = req.params.id;

    const category = await db
      .delete(categorySchema)
      .where(
        and(
          eq(categorySchema.id, id),
          eq(categorySchema.userID, req.auth?.id!),
        ),
      )
      .returning();

    if (category.length < 1)
      return res.status(400).json({ error: "Could not find category" });

    return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});
