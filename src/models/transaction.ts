import { check, date, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
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
import { categorySchema, categorySelectSchema } from "./category";
import { accountSchema } from "./account";
import { dateField } from "../utils/models";

export const transactionSchema = pgTable(
  "transaction",
  {
    id: uuid().primaryKey().defaultRandom(),
    date: date().notNull(),
    cent_inflow: integer(),
    cent_outflow: integer(),
    payee: text().notNull(),
    account_id: uuid()
      .notNull()
      .references(() => accountSchema.id, { onDelete: "cascade" }),
    category_id: uuid().references(() => categorySchema.id),
    user_id: uuid()
      .notNull()
      .references(() => userSchema.id, { onDelete: "cascade" }),
  },
  (t) => [
    check(
      "txn_one_positive_check",
      sql`(
        ( ${t.cent_inflow} is null ) <> ( ${t.cent_outflow} is null )
      )`,
    ),
    check(
      "txn_nonnegative_check",
      sql`(
        (${t.cent_inflow} is null or ${t.cent_inflow} >= 0)
        and (${t.cent_outflow} is null or ${t.cent_outflow} >= 0)
      )`,
    ),
  ],
);

export type TransactionInsert = InferInsertModel<typeof transactionSchema>;
export type TransactionSelect = InferSelectModel<typeof transactionSchema>;

const commonExtends = {
  inflow: zod.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    zod.coerce.number().optional(),
  ),
  outflow: zod.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    zod.coerce.number().optional(),
  ),
};
const commonOmits = {
  user_id: true,
  cent_inflow: true,
  cent_outflow: true,
} as const;

export const transactionInsertSchema = createInsertSchema(transactionSchema, {
  date: dateField,
})
  .extend(commonExtends)
  .omit({ id: true, ...commonOmits })
  .superRefine(({ inflow, outflow }, ctx) => {
    const _inflow = Number(inflow ?? 0);
    const _outflow = Number(outflow ?? 0);
    if (_inflow < 0 || _outflow < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Inflow and outflow cannot be negative",
        path: [],
      });
      return;
    }

    if (_inflow > 0 === _outflow > 0) {
      ctx.addIssue({
        code: "custom",
        message: "Transaction must have exactly one positive inflow or outflow",
        path: [],
      });
    }
  });
export const bulkTransactionInsertSchema = zod.array(transactionInsertSchema);

export const transactionSelectSchema = createSelectSchema(transactionSchema)
  .extend({
    category: categorySelectSchema.nullable().optional(),
    ...commonExtends,
  })
  .omit(commonOmits);
export const bulkTransactionSelectSchema = zod.array(transactionSelectSchema);

export const transactionUpdateSchema = createUpdateSchema(transactionSchema, {
  date: dateField.optional(),
})
  .extend(commonExtends)
  .omit({ id: true, ...commonOmits })
  .superRefine(({ inflow, outflow }, ctx) => {
    if ((inflow ?? 0) < 0 || (outflow ?? 0) < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Inflow and outflow cannot be negative",
        path: [],
      });
    }
  });
export const bulkTransactionUpdatSchema = zod.array(transactionUpdateSchema);

export const transactionOutputSchema = {
  ...getColumns(transactionSchema),
  inflow: sql<number>`(coalesce(${transactionSchema.cent_inflow}, 0) / 100.0)::double precision`,
  outflow: sql<number>`(coalesce(${transactionSchema.cent_outflow}, 0) / 100.0)::double precision`,
};
