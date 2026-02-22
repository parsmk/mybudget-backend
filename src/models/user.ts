import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { email, z as zod } from "zod";
import { uuidPK } from "../utils/models";

export const userSchema = sqliteTable("user", {
  id: uuidPK(),
  email: text().notNull().unique(),
  password_hash: text().notNull(),
  verified: integer().notNull().default(0),
  verification_token: text(),
});

export const userCreateSchema = zod.object({
  email: zod.email(),
  password: zod
    .string()
    .trim()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Za-z]/, "Must contain at least one character!")
    .regex(/[0-9]/, "Must contain at least one number!")
    .regex(/[^A-Za-z0-9\s]/, "Must contain at least one special character!")
    .regex(/^\S+$/, "Cannot contain spaces"),
});

export const userSelectSchema = zod.object({
  email: zod.email(),
  password: zod.string().trim(),
});
