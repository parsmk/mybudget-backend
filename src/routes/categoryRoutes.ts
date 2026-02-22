import { Router } from "express";
import { z as zod } from "zod";
import {
  createCategories,
  deleteCategory,
  getCategories,
  patchCategory,
} from "../queries/categoryQueries";
import {
  bulkCategorySelectSchema,
  CategoryInsert,
  categoryInsertSchema,
  categorySelectSchema,
  categoryUpdateSchema,
} from "../models/category";
import { formatCreateResponse } from "../utils/routes";

export const categoryRouter = Router();

categoryRouter.post("/", async (req, res) => {
  try {
    if (!req.body)
      return res.status(400).json({ error: "No categories supplied" });

    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const categories: CategoryInsert[] = [];
    const errs = [];
    for (const dp of payload) {
      const parsed = categoryInsertSchema.safeParse({ name: dp.name });

      if (!parsed.success) {
        errs.push(zod.flattenError(parsed.error));
        continue;
      }

      const { name } = parsed.data;

      categories.push({
        name,
        user_id: req.auth?.id!,
      });
    }

    const uploaded = await createCategories(categories);

    const [status, response] = formatCreateResponse(uploaded, errs);
    return res.status(status).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.get("/", async (req, res) => {
  try {
    const categories = await getCategories(req.auth?.id!);
    return res.status(200).json(bulkCategorySelectSchema.parse(categories));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});

categoryRouter.patch<{ id: string }>("/:id", async (req, res) => {
  try {
    const parsed = categoryUpdateSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json(zod.flattenError(parsed.error));

    const category = await patchCategory(
      req.params.id,
      req.auth?.id!,
      parsed.data,
    );
    if (!category)
      return res.status(404).json({ error: "Could not find category" });
    else return res.status(200).json(categorySelectSchema.parse(category));
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
    else return res.status(200).json(categorySelectSchema.parse(category));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
});
