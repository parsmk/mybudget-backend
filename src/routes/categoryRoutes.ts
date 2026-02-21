import { Router } from "express";
import {
  createCategories,
  deleteCategory,
  getCategories,
  patchCategory,
} from "../models/category";

export const categoryRouter = Router();

categoryRouter.post("/", async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    if (payload.length < 1)
      return res.status(400).json({ error: "No categories supplied" });

    const newCategories = payload.map((dp) => ({
      name: dp.name,
      userID: req.auth?.id!,
    }));

    const categories = await createCategories(newCategories);

    if (categories.length < 1)
      return res.status(500).json({ error: "Error creating categories" });

    return res.status(201).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.get("/", async (req, res) => {
  try {
    const categories = await getCategories(req.auth?.id!);
    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.patch<{ id: string }>("/:id", async (req, res) => {
  try {
    const category = await patchCategory(req.params.id, req.auth?.id!, {
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

categoryRouter.delete<{ id: string }>("/:id", async (req, res) => {
  try {
    const category = await deleteCategory(req.params.id, req.auth?.id!);

    if (!category)
      return res.status(404).json({ error: "Could not find category" });
    else return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});
