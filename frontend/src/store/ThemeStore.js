import { create } from "zustand";

export const ThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "Light",
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
  
}));
