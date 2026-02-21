import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/zod";
import { userSchema } from "./user";
import { uuidPK } from "../utils/models";

export const categorySchema = sqliteTable("category", {
  id: uuidPK(),
  name: text().notNull(),
  userID: text()
    .notNull()
    .references(() => userSchema.id, { onDelete: "cascade" }),
});

export type CategoryInsert = InferInsertModel<typeof categorySchema>;
export type CategorySelect = InferSelectModel<typeof categorySchema>;

export const categoryInsertSchema = createInsertSchema(categorySchema);
export const categorySelectSchema = createSelectSchema(categorySchema);
export const categoryUpdateSchema = createUpdateSchema(categorySchema);
