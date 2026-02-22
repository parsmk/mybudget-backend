import { boolean, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { z as zod } from "zod";

export const userSchema = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  password_hash: text().notNull(),
  verified: boolean().notNull().default(false),
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
