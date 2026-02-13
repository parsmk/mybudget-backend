import { numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { uuidPK } from "../utils/models";
import { userSchema } from "./user";

export const transactionSchema = sqliteTable("transaction", {
  id: uuidPK(),
  date: text().notNull(),
  inflow: numeric(),
  outflow: numeric(),
  payee: text().notNull(),
  categoryID: text().references(() => categorySchema.id),
  userID: text()
    .notNull()
    .references(() => userSchema.id),
});

export const categorySchema = sqliteTable("category", {
  id: uuidPK(),
  name: text().notNull(),
  userID: text()
    .notNull()
    .references(() => userSchema.id),
});
