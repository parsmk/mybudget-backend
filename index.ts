import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authRouter } from "./routes/authRoutes";

// Config
const PORT = 5000;
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`${res.statusCode}: ${req.url}`);
  });
  next();
});

// Routes
app.use("/", authRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}: http://localhost:${PORT}`);
});
