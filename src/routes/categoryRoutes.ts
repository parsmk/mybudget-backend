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
  CategorySelect,
  categorySelectSchema,
  categoryUpdateSchema,
} from "../models/category";
import { formatCreateResponse, formatErrorResponse } from "../utils/routes";

export const categoryRouter = Router();

categoryRouter.post("/", async (req, res) => {
  try {
    if (!req.body)
      return res
        .status(400)
        .json(formatErrorResponse("No categories supplied"));

    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const categories: CategoryInsert[] = [];
    const errs = [];

    for (let i = 0; i < payload.length; i++) {
      const dp = payload[i];
      const parsed = categoryInsertSchema.safeParse({ name: dp.name });

      if (!parsed.success) {
        errs.push({ index: i, errors: zod.flattenError(parsed.error) });
        continue;
      }

      const { name } = parsed.data;

      categories.push({
        name,
        user_id: req.auth?.id!,
      });
    }
    let uploaded;
    if (categories.length > 0) uploaded = await createCategories(categories);

    return res
      .status(200)
      .json(
        formatCreateResponse(
          uploaded ? bulkCategorySelectSchema.parse(uploaded) : [],
          errs,
        ),
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Internal error"));
  }
});

categoryRouter.get("/", async (req, res) => {
  try {
    const categories = await getCategories(req.auth?.id!);
    return res.status(200).json(bulkCategorySelectSchema.parse(categories));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Internal error"));
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
      return res
        .status(404)
        .json(formatErrorResponse("Could not find category"));

    return res.status(200).json(categorySelectSchema.parse(category));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Internal error"));
  }
});

categoryRouter.delete<{ id: string }>("/:id", async (req, res) => {
  try {
    const category = await deleteCategory(req.params.id, req.auth?.id!);

    if (!category)
      return res
        .status(404)
        .json(formatErrorResponse("Could not find category"));

    return res.status(200).json(categorySelectSchema.parse(category));
  } catch (error) {
    console.error(error);
    return res.status(500).json(formatErrorResponse("Internal error"));
  }
});
