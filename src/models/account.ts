import { integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-orm/zod";
import {
  getColumns,
  InferInsertModel,
  InferSelectModel,
  sql,
} from "drizzle-orm";
import { z as zod } from "zod";
import { userSchema } from "./user";

export const ACCOUNT_TYPES = ["chequing", "credit", "cash"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export const accountTypeEnum = pgEnum("type", ACCOUNT_TYPES);

export const accountSchema = pgTable("account", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  cent_balance: integer().notNull(),
  type: accountTypeEnum("type").notNull(),
  user_id: uuid()
    .notNull()
    .references(() => userSchema.id, { onDelete: "cascade" }),
});

export type AccountInsert = InferInsertModel<typeof accountSchema>;
export type AccountSelect = InferSelectModel<typeof accountSchema>;

const commonOmits = { user_id: true, cent_balance: true } as const;
const commitExtends = { balance: zod.number() } as const;

export const accountInsertSchema = createInsertSchema(accountSchema, {
  type: zod.enum(ACCOUNT_TYPES),
})
  .extend(commitExtends)
  .omit({ id: true, ...commonOmits });
export const bulkAccountInsertSchema = zod.array(accountInsertSchema);

export const accountSelectSchema = createSelectSchema(accountSchema)
  .extend(commitExtends)
  .omit(commonOmits);
export const bulkAccountSelectSchema = zod.array(accountSelectSchema);

export const accountUpdateSchema = createUpdateSchema(accountSchema, {
  type: zod.enum(ACCOUNT_TYPES),
})
  .extend(commitExtends)
  .omit({ id: true, ...commonOmits });
export const bulkAccountUpdateSchema = zod.array(accountUpdateSchema);

export const accountOutputSchema = {
  ...getColumns(accountSchema),
  balance: sql<number>`${accountSchema.cent_balance} / 100.0`,
};
