import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authRouter } from "./routes/authRoutes";
import { transactionRouter } from "./routes/transactionRoutes";
import { logEndpoint } from "./middleware/logEndpoint";
import { categoryRouter } from "./routes/categoryRoutes";
import { accountRouter } from "./routes/accountRoutes";
import { ensureAuth } from "./middleware/ensureAuth";

// Config
const PORT = 5000;
const app = express();
const CORS = {
  origin: "http://localhost:3000",
  credentials: true,
};

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(CORS));
app.use(logEndpoint);

// Routes
app.use("/", authRouter);
app.use("/transaction", ensureAuth, transactionRouter);
app.use("/category", ensureAuth, categoryRouter);
app.use("/account", ensureAuth, accountRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}: http://localhost:${PORT}`);
});
