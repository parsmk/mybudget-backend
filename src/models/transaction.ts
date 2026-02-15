import { numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { uuidPK } from "../utils/models";
import { userSchema } from "./user";
import { categorySchema } from "./category";
import { accountSchema } from "./account";

export const transactionSchema = sqliteTable("transaction", {
  id: uuidPK(),
  date: text().notNull(),
  inflow: numeric(),
  outflow: numeric(),
  payee: text().notNull(),
  accountID: text()
    .notNull()
    .references(() => accountSchema.id),
  categoryID: text().references(() => categorySchema.id),
  userID: text()
    .notNull()
    .references(() => userSchema.id),
});
