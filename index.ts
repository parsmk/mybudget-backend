import express from "express";
import { drizzle } from "drizzle-orm/libsql";

import { authRouter } from "./routes/authRoutes";

// Config
const PORT = 3000;
const app = express();

// MiddleWare
app.use(express.json());

// Routes
app.use("/", authRouter);

// Start Server and DB
export const db = drizzle(process.env.DATABASE_URL!);

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}: http//localhost:3000`);
});
