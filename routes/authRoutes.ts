import { Router } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { userSchema } from "../models/user";
import { signTokens } from "../utils/signTokens";
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

    return res.status(200).json({
      access_token: signTokens(res, { id: user.id, email: user.email }),
    });
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

    return res.status(201).json({
      access_token: signTokens(res, { id: newUser.id, email: newUser.email }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ signup: "Internal Error!" });
  }
});
