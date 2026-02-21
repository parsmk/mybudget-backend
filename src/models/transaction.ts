import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  InferInsertModel,
  InferSelectModel,
  getColumns,
  sql,
} from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/zod";
import { z as zod } from "zod";
import { userSchema } from "./user";
import { categorySchema } from "./category";
import { accountSchema } from "./account";
import { uuidPK } from "../utils/models";

export const transactionSchema = sqliteTable("transaction", {
  id: uuidPK(),
  date: text().notNull(),
  cent_inflow: integer(),
  cent_outflow: integer(),
  payee: text().notNull(),
  accountID: text()
    .notNull()
    .references(() => accountSchema.id, { onDelete: "cascade" }),
  categoryID: text().references(() => categorySchema.id),
  userID: text()
    .notNull()
    .references(() => userSchema.id, { onDelete: "cascade" }),
});

export type TransactionInsert = InferInsertModel<typeof transactionSchema>;
export type TransactionSelect = InferSelectModel<typeof transactionSchema>;

export const transactionInsertSchema = createInsertSchema(
  transactionSchema,
).omit({
  id: true,
  userID: true,
});
export const bulkTransactionInsertSchema = zod.array(transactionInsertSchema);

export const transactionSelectSchema = createSelectSchema(transactionSchema)
  .extend({
    inflow: zod.number(),
    outflow: zod.number(),
  })
  .omit({
    id: true,
    userID: true,
    cent_inflow: true,
    cent_outflow: true,
  });
export const bulkTransactionSelectSchema = zod.array(transactionSelectSchema);

export const transactionUpdateSchema = createUpdateSchema(
  transactionSchema,
).omit({
  id: true,
  userID: true,
});
export const bulkTransactionUpdatSchema = zod.array(transactionUpdateSchema);

export const transactionOutputSchema = {
  ...getColumns(transactionSchema),
  inflow: sql<number>`coalesce(${transactionSchema.cent_inflow}, 0) / 100.0`,
  outflow: sql<number>`coalesce(${transactionSchema.cent_outflow}, 0) / 100.0`,
};
