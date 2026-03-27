import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import axios from "axios";
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
    const onlineUsers = useAuthStore.getState().onlineUsers;

    // sort: online first, then by last message time
    const sorted = [...res.data].sort((a, b) => {
      const aOnline = onlineUsers.includes(a._id);
      const bOnline = onlineUsers.includes(b._id);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    set({ users: sorted });
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to load users");
  } finally {
    set({ isUsersLoading: false });
  }
},

 deleteMessage: async (messageId) => {
  try {
    const res = await axiosInstance.delete("/messages/delete", {
      data: { id: messageId },
    });
    if (!res.data.success) {
      toast.error(res.data.message);
      return;
    }
    // soft-delete to match server — set isDeleted:true instead of removing
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, isDeleted: true } : msg
      ),
    }));
    toast.success("Message deleted");
  } catch (error) {
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
  socket.off("newMessage"); // prevent stacking

  socket.on("newMessage", (message) => {
    const { users, messages, selectedUser } = get();
    const isActiveChat = selectedUser && message.senderId === selectedUser._id;

    if (isActiveChat) {
      set({
        messages: [...messages, message],
        isTyping: false, //clear typing indicator when message arrives
      });
    }

    const updatedUsers = users.map((u) => {
      if (u._id === message.senderId) {
        return {
          ...u,
          lastMessage: message.text || "media",
          lastMessageTime: new Date().toISOString(), //update time for sorting
          unreadCount: isActiveChat ? 0 : (u.unreadCount || 0) + 1,
        };
      }
      return u;
    });

    // re-sort so active/recent chats float to top
    updatedUsers.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    set({ users: updatedUsers });
  });
},
setSelectedUser: (user) => {
  set((state) => ({
    selectedUser: user,
    users: user
      ? state.users.map((u) => u._id === user._id ? { ...u, unreadCount: 0 } : u)
      : state.users,
  }));
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
  //  always remove before re-adding so they don't stack
  socket.off("userTyping");
  socket.off("userStopTyping");

  socket.on("userTyping", (senderId) => {
    //  read selectedUser fresh from store, not from stale closure
    const { selectedUser } = useChatStore.getState();
    if (selectedUser && senderId === selectedUser._id) {
      set({ isTyping: true });
    }
  });

  socket.on("userStopTyping", (senderId) => {
    const { selectedUser } = useChatStore.getState();
    if (selectedUser && senderId === selectedUser._id) {
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
  },

listenWhiteboardInvite: (navigate) => {
  const socket = useAuthStore.getState().socket;
  socket.off("whiteboardInvite"); // remove old listener first
  // ✅ capital I — matches what the server actually emits
  socket.on("whiteboardInvite", ({ roomId, senderId }) => {
    navigate(`/whiteboard/${roomId}`);
  });
},

listenWhiteboardCreated: (navigate) => {
  const socket = useAuthStore.getState().socket;
  socket.off("whiteboardCreated");
  socket.on("whiteboardCreated", ({ roomId }) => {
    navigate(`/whiteboard/${roomId}`);
  });
},
unlistenWhiteboard : () => {
  const socket = useAuthStore.getState().socket;
  socket.off('whiteboardInvite');
  socket.off('whiteboardCreated');
}
}));
