import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";

export const ensureAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies["accessToken"];
    const refreshToken = req.cookies["refreshToken"];

    if (!(accessToken && refreshToken)) return res.sendStatus(401);

    verifyToken("access", accessToken);
    verifyToken("refresh", refreshToken);
    return next();
  } catch (err) {
    return res.sendStatus(401);
  }
};
