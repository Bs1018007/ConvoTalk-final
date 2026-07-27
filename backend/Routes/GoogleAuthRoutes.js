import express from "express";
import passport from "passport";
import { generateToken } from "../lib/jwtokens.js";

const router = express.Router();

const CLIENT_URL = process.env.FRONTEND_URL || "http://localhost:5173";

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const token = generateToken(req.user._id, res);
    res.redirect(`${CLIENT_URL}?token=${token}`);
  }
);

router.get("/logout", (req, res) => {
  // Clear JWT cookie
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined
  });

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
    });
  }

  const cookies = req.cookies;
  for (let cookie in cookies) {
    res.clearCookie(cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined
    });
  }

  res.redirect(`${CLIENT_URL}/login`);
});

router.get("/user", (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not Authenticated" });
  res.json(req.user || null);
});

export default router;
