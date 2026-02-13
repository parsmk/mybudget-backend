import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";

export const ensureAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) return res.sendStatus(401);
    req.auth = verifyToken("access", accessToken);
    return next();
  } catch (err) {
    return res.sendStatus(401);
  }
};
