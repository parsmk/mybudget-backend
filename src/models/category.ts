import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { uuidPK } from "../utils/models";
import { userSchema } from "./user";

export const categorySchema = sqliteTable("category", {
  id: uuidPK(),
  name: text().notNull(),
  userID: text()
    .notNull()
    .references(() => userSchema.id),
});
