import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: process.env.DATABASE_URL!,
});

// fire once at startup
client.execute("PRAGMA foreign_keys = ON").catch(console.error);

export const db = drizzle(client);
