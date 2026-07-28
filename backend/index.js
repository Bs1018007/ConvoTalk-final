import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { MongoDB } from "./lib/db.js";
console.log("MongoDB imported");
import Cookieparser from "cookie-parser";
import AuthRoutes from "./Routes/AuthRoutes.js";
console.log("AuthRoutes imported");
import MessageRoutes from "./Routes/MessageRoutes.js";
console.log("MessageRoutes imported");
import cors from "cors";
import { app, server } from "./lib/socket.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import "./lib/passport.js";
console.log("passport imported");
import GoogleAuthRoutes from "./Routes/GoogleAuthRoutes.js";

const port = process.env.PORT || 3000;
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

console.log("Express CORS origin:", FRONTEND_URL);

app.use(express.json({ limit: "10mb" }));
app.use(Cookieparser());

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "https://convo-talk-final.vercel.app"],
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

console.log("Initializing session middleware...");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day

    }
  })
);
console.log("Session middleware initialized");

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", AuthRoutes);
app.use("/api/message", MessageRoutes);
app.use("/auth", GoogleAuthRoutes);




console.log("Attempting to start server...");
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  MongoDB();
});
