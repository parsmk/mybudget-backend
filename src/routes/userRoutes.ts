import { Router } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { userSchema } from "../models/user";
import {
  clearTokens,
  signAccessToken,
  signTokens,
  verifyToken,
} from "../utils/auth";
import { db, resend } from "../services";
import { queryBuilder } from "../utils/models";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Mimic zods errors
    const fieldErrors: Record<string, string[]> = {};
    if (!email) fieldErrors.email = ["Required field!"];
    if (!password) fieldErrors.password = ["Required field!"];
    if (!email || !password) return res.status(400).json({ fieldErrors });

    const [user] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.email, email));

    if (!user) return res.status(404).json({ errors: ["User not found"] });

    if (!user.verified)
      return res.status(403).json({ errors: ["User is not verified"] });

    const authenticate = await bcrypt.compare(password, user.password_hash);

    if (!authenticate)
      return res.status(401).json({ errors: ["Invalid credentials."] });

    signTokens(res, {
      id: user.id,
      email: user.email,
    });
    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: ["Internal Error!"] });
  }
});

authRouter.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const fieldErrors: Record<string, string[]> = {};
    if (!email) fieldErrors.email = ["Required field!"];
    if (!password) fieldErrors.password = ["Required field!"];
    if (!email || !password) return res.status(400).json({ fieldErrors });

    const verificationToken = randomUUID();

    const [newUser] = await db
      .insert(userSchema)
      .values({
        email: email,
        password_hash: await bcrypt.hash(password, 10),
        verified: 0,
        verification_token: verificationToken,
      })
      .returning();

    if (!newUser)
      return res.status(500).json({ errors: ["Error creating new user!"] });

    const urlString = `${process.env.ORIGIN}/verify?${new URLSearchParams({ token: verificationToken, id: newUser.id }).toString()}`;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: newUser.email,
      subject: "MyBudget app - Verify email",
      html: `<p>Verify your email using <a href="${urlString}">this link</a>!</p>`,
    });

    return res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: ["Internal Error!"] });
  }
});

authRouter.get("/verify", async (req, res) => {
  try {
    const token =
      typeof req.query.token === "string" ? req.query.token : undefined;
    const id = typeof req.query.id === "string" ? req.query.id : undefined;

    const fieldErrors: Record<string, string[]> = {};
    if (!token) fieldErrors.token = ["Required param!"];
    if (!id) fieldErrors.id = ["Required param!"];
    if (!token || !id) return res.status(400).json({ fieldErrors });

    const [updated] = await db
      .update(userSchema)
      .set({ verified: 1, verification_token: null })
      .where(
        queryBuilder(
          "and",
          eq(userSchema.id, id),
          eq(userSchema.verification_token, token),
          eq(userSchema.verified, 0),
        ),
      )
      .returning();

    if (updated) return res.redirect(process.env.FRONT_END!);

    const [existing] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, id));

    if (existing && existing.verified)
      return res.redirect(process.env.FRONT_END!);

    return res.status(400).json({ errors: ["Invalid verification link"] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errors: ["Internal Error!"] });
  }
});

authRouter.post("/logout", async (req, res) => {
  clearTokens(res);
  return res.sendStatus(204);
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies["refreshToken"];
  if (!token) return res.sendStatus(401);

  try {
    const payload = verifyToken("refresh", token);

    signAccessToken(res, {
      id: payload.id,
      email: payload.email,
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(403);
  }
});
