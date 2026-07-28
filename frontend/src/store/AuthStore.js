import { create } from "zustand";
import { axiosInstance } from "../../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : import.meta.env.VITE_API_BASE_URL;

export const AuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  isCheckingAuth: true,
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/api/auth/check");
      if (res.data) {
        set({ authUser: res.data });
        get().connectSocket();
      } else {
        set({ authUser: null });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("No auth token found, user not logged in.");
        localStorage.removeItem("jwt_token");
      } else {
        console.error("Unexpected error in checkAuth:", error);
      }
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/api/auth/signup", data);
      // Store token in localStorage for cross-domain auth
      if (res.data.token) {
        localStorage.setItem("jwt_token", res.data.token);
      }
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/api/auth/login", data);
      // Store token in localStorage for cross-domain auth
      if (res.data.token) {
        localStorage.setItem("jwt_token", res.data.token);
      }
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  loginWithGoogle: () => {
    const redirectUrl = import.meta.env.MODE === "development" 
      ? "http://localhost:3000/auth/google"
      : `${BASE_URL}/auth/google`;
    window.location.href = redirectUrl;
  },

  logout: async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
      
      localStorage.removeItem("jwt_token");
      set({ authUser: null });
      get().disconnectSocket();
      
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/api/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  deleteAccount: async () => {
    try {
      await axiosInstance.delete("/api/auth/delete-account");
      localStorage.removeItem("jwt_token");
      set({ authUser: null });
      get().disconnectSocket();
      localStorage.clear();
      toast.success("Account deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    // Disconnect any existing stale socket before creating a new one
    const existingSocket = get().socket;
    if (existingSocket) {
      if (existingSocket.connected) return; // Already connected, nothing to do
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
    }

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    socket.connect();

    set({ socket: socket });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
