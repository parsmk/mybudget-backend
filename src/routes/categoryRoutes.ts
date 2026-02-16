import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";
import {
  createCategories,
  deleteCategory,
  getCategories,
  patchCategory,
} from "../models/category";

export const categoryRouter = Router();

categoryRouter.post("/", ensureAuth, async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const newCategories = payload.map((dp) => ({
      ...dp,
      userID: req.auth?.id!,
    }));
    const categories = await createCategories(newCategories);

    return res.status(201).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.get("/", ensureAuth, async (req, res) => {
  try {
    const categories = getCategories(req.auth?.id!);
    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.patch<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const category = patchCategory(req.params.id, req.auth?.id!, {
      name: req.body.name,
    });

    if (!category)
      return res.status(404).json({ error: "Could not find category" });
    else return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.delete<{ id: string }>("/:id", ensureAuth, async (req, res) => {
  try {
    const category = deleteCategory(req.params.id, req.auth?.id!);

    if (!category)
      return res.status(404).json({ error: "Could not find category" });
    else return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});
