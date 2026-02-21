import { eq, and } from "drizzle-orm";
import { db } from "../services";
import { CategoryInsert, categorySchema } from "../models/category";

export const createCategories = async (categories: CategoryInsert[]) => {
  return await db.insert(categorySchema).values(categories).returning();
};

export const getCategories = async (userID: string) => {
  return await db
    .select()
    .from(categorySchema)
    .where(eq(categorySchema.userID, userID));
};

export const patchCategory = async (
  categoryID: string,
  userID: string,
  updates: Partial<Omit<CategoryInsert, "id" | "userID">>,
) => {
  return (
    await db
      .update(categorySchema)
      .set(updates)
      .where(
        and(
          eq(categorySchema.id, categoryID),
          eq(categorySchema.userID, userID),
        ),
      )
      .returning()
  )[0];
};

export const deleteCategory = async (categoryID: string, userID: string) => {
  return (
    await db
      .delete(categorySchema)
      .where(
        and(
          eq(categorySchema.id, categoryID),
          eq(categorySchema.userID, userID),
        ),
      )
      .returning()
  )[0];
};
