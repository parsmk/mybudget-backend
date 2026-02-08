import { text, sqliteTable } from "drizzle-orm/sqlite-core";
import { uuidPK } from "../utils/uuidPK";

export const user = sqliteTable("user", {
  id: uuidPK(),
  email: text().notNull().unique(),
  password_hash: text().notNull(),
});
