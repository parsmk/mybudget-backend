import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import "dotenv/config";
import { Resend } from "resend";

//DB
const client = createClient({
  url: process.env.DATABASE_URL!,
});

client.execute("PRAGMA foreign_keys = ON").catch(console.error);

export const db = drizzle(client);

//RESEND
export const resend = new Resend(process.env.RESEND_KEY);
