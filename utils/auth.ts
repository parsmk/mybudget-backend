import jwt from "jsonwebtoken";
import { Response } from "express";

import { computeMS } from "./computeMS";
import "dotenv/config";

const isSecure = process.env.NODE_ENV !== "development";
const isSameSite = process.env.NODE_ENV === "development" ? "lax" : "none";

export type TokenPayload = {
  id: string;
  email: string;
};

export const signTokens = (res: Response, payload: TokenPayload) => {
  return [signAccessToken(res, payload), signRefreshToken(res, payload)];
};

export const signAccessToken = (res: Response, payload: TokenPayload) => {
  const accessToken = jwt.sign(
    { id: payload.id, email: payload.email },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "15m" },
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSameSite,
    maxAge: computeMS([15, "mins"]),
  });

  return accessToken;
};

export const signRefreshToken = (res: Response, payload: TokenPayload) => {
  const refreshToken = jwt.sign(
    { id: payload.id, email: payload.email },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "1d" },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSameSite,
    path: "/refresh",
    maxAge: computeMS([1, "days"]),
  });

  return refreshToken;
};

export const verifyToken = (type: "refresh" | "access", token: string) => {
  return jwt.verify(
    token,
    type === "access"
      ? process.env.ACCESS_TOKEN_SECRET!
      : process.env.REFRESH_TOKEN_SECRET!,
  ) as TokenPayload;
};
