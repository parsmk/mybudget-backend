import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./src/models/*",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
