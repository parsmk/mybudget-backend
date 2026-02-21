import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { uuidPK } from "../utils/models";

export const userSchema = sqliteTable("user", {
  id: uuidPK(),
  email: text().notNull().unique(),
  password_hash: text().notNull(),
  verified: integer().notNull().default(0),
  verification_token: text(),
});
