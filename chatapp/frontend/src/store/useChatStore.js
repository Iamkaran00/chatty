import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import axios from "axios";
import { Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,
  isGameActive : false,
  setIsGameActive : status => set({isGameActive :status}),
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.messages);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const { messages } = get();
      console.log("hi there delete");
      const res = await axiosInstance.delete("/messages/delete", {
        data: { id: messageId },
      });

      if (!res.data.success) {
        toast.error(res.data.message);
        return;
      }

      const updatedMessages = messages.filter((msg) => msg._id !== messageId);

      set({ messages: updatedMessages });

      toast.success("Message deleted");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  },
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    console.log(messageData, "here is messagedata");
    const { selectedUser, messages } = get();
    if (!selectedUser) return;
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );
      console.log(res);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.log("error occured");
      toast.error(error.response.data.message);
    }
  },
listenMessage: () => {

  const socket = useAuthStore.getState().socket;
  const authUser = useAuthStore.getState().authUser;

  socket.on("newMessage", (message) => {

    const { users, messages, selectedUser } = get();

    if (selectedUser && message.senderId === selectedUser._id) {

      set({
        messages: [...messages, message]
      });

    }

    const updatedUsers = users.map((u) => {

      if (u._id === message.senderId) {

        return {
          ...u,
          lastMessage: message.text || "media",
          unreadCount: (u.unreadCount || 0) + 1
        };

      }

      return u;

    });

    set({ users: updatedUsers });

  });

},
setSelectedUser: (user) => {

  set((state) => ({

    selectedUser: user,

    users: state.users.map((u) =>
      u._id === user._id
        ? { ...u, unreadCount: 0 }
        : u
    )

  }));

},

  getUsers: async () => {

  try {

    set({ isUserLoading: true });

    const res = await axiosInstance.get("/messages/users");

    set({ users: res.data });

  } catch (error) {

    console.log(error);

  } finally {

    set({ isUserLoading: false });

  }

},
  listenSeen: () => {
    const socket = useAuthStore.getState().socket;

    const handler = ({ senderId, receiverId }) => {
      const { selectedUser } = get();
      const authUser = useAuthStore.getState().authUser;

      if (!selectedUser) return;

      const isRelevant =
        selectedUser._id === senderId || selectedUser._id === receiverId;
      if (!isRelevant) return;
      set((state) => {
        const updatedMessages = state.messages.map((msg) => {
          if (
            (msg.senderId === senderId && msg.receiverId === receiverId) ||
            (msg.senderId === receiverId && msg.receiverId === senderId)
          ) {
            return { ...msg, isSeen: true };
          }
          return msg;
        });
        return { messages: updatedMessages };
      });
    };

    socket.on("messagesSeen", handler);
    return () => socket.off("messagesSeen", handler);
  },

  unlistenSeen: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("messagesSeen");
  },

  unlistenMessage: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUsers: async (selecteduser) => {
    set({ selectedUser: selecteduser });
  },
  markMessageSeen: async (senderId) => {
    try {
      const socket = useAuthStore.getState().socket;
      const authUserId = useAuthStore.getState().authUser._id;

      // Just emit to socket; backend will handle DB update and event broadcast
      socket.emit("markAsSeen", {
        senderId,
        receiverId: authUserId,
      });
    } catch (error) {
      console.error("Error marking message as seen:", error);
      toast.error("Failed to mark as seen");
    }
  },
  listenDeleteMessage: () => {
    const socket = useAuthStore.getState().socket;
    socket.on("messageDeleted", (msgId) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === msgId ? { ...msg, isDeleted: true } : msg,
        ),
      }));
    });
  },
  unlistenDeleteMessage: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("messageDeleted");
  },
  listenTyping: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("userTyping");
    socket.off("userStopTyping");
    socket.on("userTyping", (senderId) => {
      const { selectedUser } = get();
      if (!selectedUser) return;
      if (senderId == selectedUser._id) {
        set({ isTyping: true });
      }
    });
    socket.on("userStopTyping", (senderId) => {
      const { selectedUser } = get();
      if (!selectedUser) return;

      if (senderId === selectedUser._id) {
        set({ isTyping: false });
      }
    });
  },
  unlistenTyping: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("userTyping");
    socket.off("userStopTyping");
  },
listenReaction: () => {
  const socket = useAuthStore.getState().socket;

  socket.off("messageReactionUpdate");

  socket.on("messageReactionUpdate", ({ messageId, reactions }) => {

    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId
          ? { ...m, reactions }
          : m
      ),
    }));

  });
},
  unlistenReaction : () => {
    const socket = useAuthStore.getState().socket ; 
    socket.off('messageReactionUpdate');
  },
  reactToMessage : (messageId,emoji) => {
    const socket = useAuthStore.getState().socket ; 
    const userId = useAuthStore.getState().authUser._id;
    socket.emit("reactMessage" , {
      messageId,
      emoji,userId
    })
  }
}));
