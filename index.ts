import express from "express";
import { drizzle } from "drizzle-orm/libsql";
import "dotenv/config";

const PORT = 3000;
const app = express();
const db = drizzle(process.env.DATABASE_URL!);

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}: http//localhost:3000`);
});
