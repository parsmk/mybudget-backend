import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/zod";
import { z as zod } from "zod";
import { userSchema } from "./user";
import { uuidPK } from "../utils/models";

export const categorySchema = sqliteTable("category", {
  id: uuidPK(),
  name: text().notNull(),
  user_id: text()
    .notNull()
    .references(() => userSchema.id, { onDelete: "cascade" }),
});

export type CategoryInsert = InferInsertModel<typeof categorySchema>;
export type CategorySelect = InferSelectModel<typeof categorySchema>;

const commonOmits = { user_id: true } as const;

export const categoryInsertSchema = createInsertSchema(categorySchema).omit({
  id: true,
  ...commonOmits,
});
export const bulkCategoryInsertSchema = zod.array(categoryInsertSchema);

export const categorySelectSchema =
  createSelectSchema(categorySchema).omit(commonOmits);
export const bulkCategorySelectSchema = zod.array(categorySelectSchema);

export const categoryUpdateSchema = createUpdateSchema(categorySchema).omit({
  id: true,
  ...commonOmits,
});
export const bulkCategoryUpdateSchema = zod.array(categoryUpdateSchema);
