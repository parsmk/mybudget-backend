import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { uuidPK } from "../utils/models";
import { userSchema } from "./user";

export const categorySchema = sqliteTable("category", {
  id: uuidPK(),
  name: text().notNull(),
  userID: text()
    .notNull()
    .references(() => userSchema.id, { onDelete: "cascade" }),
});

export type CategoryInsert = InferInsertModel<typeof categorySchema>;
export type CategorySelect = InferSelectModel<typeof categorySchema>;
