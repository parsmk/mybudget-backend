import type { Request, Response, NextFunction } from "express";

export const logEndpoint = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.on("finish", () => {
    console.log(`${res.statusCode}: ${req.url}`);
  });
  return next();
};
