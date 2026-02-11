import jwt from "jsonwebtoken";
import { Response } from "express";

import { ROUTEMAP } from "../routes/_map";
import { computeMS } from "./computeMS";
import "dotenv/config";

export const signTokens = (
  res: Response,
  user: { id: string; email: string },
) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "1d" },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
    path: ROUTEMAP.AUTH.REFRESH,
    maxAge: computeMS([1, "days"]),
  });

  return accessToken;
};
