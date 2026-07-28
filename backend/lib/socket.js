import { Server } from "socket.io";
import http from "http";
import express from "express";

// Strip trailing slash to prevent CORS mismatches
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

const app = express();
const server = http.createServer(app);

// Build allowed origins list - include both with and without trailing slash
const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://convo-talk-final.vercel.app",
];

console.log("Socket.io CORS allowed origins:", allowedOrigins);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Keep connections alive behind Render's reverse proxy
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowUpgrades: true,
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("=== SOCKET CONNECTION ===");
  console.log("Socket ID:", socket.id);
  console.log("userId from query:", userId, "| type:", typeof userId);
  console.log("Full query:", JSON.stringify(socket.handshake.query));
  
  if (userId && userId !== "undefined" && userId !== "null") {
    userSocketMap[userId] = socket.id;
  }

  console.log("Current userSocketMap:", JSON.stringify(userSocketMap));
  console.log("Emitting onlineUsers:", Object.keys(userSocketMap));
  console.log("========================");

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id, "for userId:", userId);
    // ONLY remove from map if THIS socket is still the current one for this user
    // This prevents a reconnect's new socket from being wiped out by the old socket's disconnect
    if (userId && userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
      console.log("Removed user from online map. Current online:", Object.keys(userSocketMap));
    } else {
      console.log("Stale socket disconnect ignored (newer socket exists). Online:", Object.keys(userSocketMap));
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

console.log("lib/socket.js loaded");
export { io, app, server };
