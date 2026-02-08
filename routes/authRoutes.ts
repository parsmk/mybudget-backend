import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { userSchema } from "../models/user";
import { db } from "..";

import { ROUTEMAP } from "./map";
import { computeMS } from "../utils/computeMS";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password))
      return res.status(400).json({ auth: "Need username and password!" });

    const user = (
      await db.select().from(userSchema).where(eq(userSchema.email, email))
    ).at(0);
    const valid = user && (await bcrypt.compare(password, user.password_hash));

    if (!valid) return res.status(400).json({ auth: "Invalid credentials." });

    const accessToken = jwt.sign(
      { id: user.id, email },
      process.env.ACCESS_SECRET!,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { id: user.id, email },
      process.env.REFRESH_SECRET!,
      { expiresIn: "1d" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      path: ROUTEMAP.AUTH.REFRESH,
      maxAge: computeMS([1, "days"]),
    });

    return res.status(200).json({ access_token: accessToken });
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
});
