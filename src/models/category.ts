import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { InferInsertModel, and, eq } from "drizzle-orm";
import { uuidPK } from "../utils/models";
import { userSchema } from "./user";
import { db } from "../db";

export const categorySchema = sqliteTable("category", {
  id: uuidPK(),
  name: text().notNull(),
  userID: text()
    .notNull()
    .references(() => userSchema.id),
});

export type CategoryInsert = InferInsertModel<typeof categorySchema>;
export type Category = InferInsertModel<typeof categorySchema>;

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
