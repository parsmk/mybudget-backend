import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
import { z as zod } from "zod/v4";
import { userSchema } from "./user";
import { uuidPK } from "../utils/models";

export const ACCOUNT_TYPES = ["chequing", "credit", "cash"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const accountSchema = sqliteTable(
  "account",
  {
    id: uuidPK(),
    name: text().notNull(),
    cent_balance: integer().notNull(),
    type: text().$type<AccountType>().notNull(),
    userID: text()
      .notNull()
      .references(() => userSchema.id, { onDelete: "cascade" }),
  },
  (table) => [
    check(
      "account_type_check",
      sql`${table.type} in (${sql.join(
        ACCOUNT_TYPES.map((t) => sql.raw(`'${t}'`)),
        sql`, `,
      )})`,
    ),
  ],
);

export type AccountInsert = InferInsertModel<typeof accountSchema>;
export type AccountSelect = InferSelectModel<typeof accountSchema>;

export const accountInsertSchema = createInsertSchema(accountSchema, {
  type: zod.enum(ACCOUNT_TYPES),
})
  .extend({ balance: zod.number() })
  .omit({ id: true, userID: true, cent_balance: true });
export const bulkAccountInsertSchema = zod.array(accountInsertSchema);

export const accountSelectSchema = createSelectSchema(accountSchema)
  .extend({ balance: zod.number() })
  .omit({
    userID: true,
    cent_balance: true,
  });
export const bulkAccountSelectSchema = zod.array(accountSelectSchema);

export const accountUpdateSchema = createUpdateSchema(accountSchema, {
  type: zod.enum(ACCOUNT_TYPES),
})
  .extend({ balance: zod.number() })
  .omit({ id: true, userID: true, cent_balance: true });
export const bulkAccountUpdateSchema = zod.array(accountUpdateSchema);

export const accountOutputSchema = {
  ...getColumns(accountSchema),
  balance: sql<number>`${accountSchema.cent_balance} / 100.0`,
};
