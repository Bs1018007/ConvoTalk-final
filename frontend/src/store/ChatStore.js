import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { AuthStore } from "./AuthStore";

export const ChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUserLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUserLoading: true });
    try {
      const res = await axiosInstance.get("/api/message/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUserLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/api/message/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/api/message/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Sending failed");
    }
  },

  deleteMessageForMe: async (messageId) => {
    try {
      await axiosInstance.put(`/api/message/delete-for-me/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  },

  deleteMessageForEveryone: async (messageId) => {
    try {
      await axiosInstance.delete(`/api/message/${messageId}`);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? {
              ...msg,
              text: "",
              image: "",
              audio: "",
              file: "",
              isDeletedForEveryone: true,
              deletedAt: new Date().toISOString(),
            }
            : msg
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = AuthStore.getState().socket;
    if (!selectedUser || !socket) return;

    socket.off("getMessage");

    socket.on("getMessage", (newMessage) => {
      const isRelevant = newMessage.senderId === selectedUser._id;
      if (isRelevant) {
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      }
    });

    socket.on("messageDeletedForEveryone", (deletedMessageId) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === deletedMessageId
            ? {
              ...msg,
              text: "",
              image: "",
              audio: "",
              file: "",
              isDeletedForEveryone: true,
              deletedAt: new Date().toISOString(),
            }
            : msg
        ),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = AuthStore.getState().socket;
    if (socket) {
      socket.off("getMessage");
      socket.off("messageDeletedForEveryone");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
