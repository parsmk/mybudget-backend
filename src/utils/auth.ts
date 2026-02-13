import jwt from "jsonwebtoken";
import { Response } from "express";
import "dotenv/config";

const isSecure = process.env.NODE_ENV !== "development";
const isSameSite = process.env.NODE_ENV === "development" ? "lax" : "none";

export type TokenPayload = {
  id: string;
  email: string;
};

type computeMSTuples = [count: number, unit: "secs" | "mins" | "hrs" | "days"];

const sec = (i: number) => i * 1000;
const min = (i: number) => i * sec(60);
const hr = (i: number) => i * min(60);
const days = (i: number) => i * hr(24);

export const computeMS = (...inputs: computeMSTuples[]) => {
  let out = 0;
  for (const i of inputs) {
    switch (i[1]) {
      case "secs":
        out += sec(i[0]);
        break;
      case "mins":
        out += min(i[0]);
        break;
      case "hrs":
        out += hr(i[0]);
        break;
      case "days":
        out += days(i[0]);
        break;
    }
  }
  return out;
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
    maxAge: computeMS([15, "secs"]),
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
    maxAge: computeMS([1, "days"]),
  });

  return refreshToken;
};

export const clearTokens = (res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};

export const verifyToken = (type: "refresh" | "access", token: string) => {
  return jwt.verify(
    token,
    type === "access"
      ? process.env.ACCESS_TOKEN_SECRET!
      : process.env.REFRESH_TOKEN_SECRET!,
  ) as TokenPayload;
};
