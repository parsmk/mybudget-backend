import { Router } from "express";
import { ensureAuth } from "../middleware/ensureAuth";

export const transactionRouter = Router();

transactionRouter.post("create", ensureAuth, (req, res) => {
  try {
  } catch {}
});
