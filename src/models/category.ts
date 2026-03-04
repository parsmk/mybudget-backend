import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/zod";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { z as zod } from "zod";
import { userSchema } from "./user";

export const categorySchema = pgTable("category", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  user_id: uuid()
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

export const categorySelectSchema =
  createSelectSchema(categorySchema).omit(commonOmits);
export const bulkCategorySelectSchema = zod.array(categorySelectSchema);

export const categoryUpdateSchema = createUpdateSchema(categorySchema).omit({
  id: true,
  ...commonOmits,
});
export const bulkCategoryUpdateSchema = categoryUpdateSchema.extend({
  id: zod.string(),
});
