import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Resend } from "resend";

//DB
export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
  },
});

//RESEND
export const resend = new Resend(process.env.RESEND_KEY);
