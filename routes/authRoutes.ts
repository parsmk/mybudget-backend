import { Router } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { userSchema } from "../models/user";
import { signAccessToken, signTokens, verifyToken } from "../utils/auth";
import { db } from "../db";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password))
      return res.status(400).json({ login: "Need username and password!" });

    const user = (
      await db.select().from(userSchema).where(eq(userSchema.email, email))
    ).at(0);
    const valid = user && (await bcrypt.compare(password, user.password_hash));

    if (!valid) return res.status(401).json({ login: "Invalid credentials." });

    const [accessToken, refreshToken] = signTokens(res, {
      id: user.id,
      email: user.email,
    });
    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ login: "Internal Error!" });
  }
});

authRouter.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password))
      return res.status(400).json({ signup: "Need email and password!" });

    const [newUser] = await db
      .insert(userSchema)
      .values({ email: email, password_hash: await bcrypt.hash(password, 10) })
      .returning();

    if (!newUser)
      return res.status(500).json({ signup: "Error creating new user!" });

    return res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ signup: "Internal Error!" });
  }
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies["refreshToken"];
  if (!token) return res.sendStatus(401);

  try {
    const payload = verifyToken("refresh", token);

    const accessToken = signAccessToken(res, {
      id: payload.id,
      email: payload.email,
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error(error);
    return res.status(403);
  }
});
