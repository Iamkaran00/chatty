import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isLoading: false,

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/groups/my-groups");
      set({ groups: res.data });
    } catch (err) {
      console.error("fetchGroups failed:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedGroup: (group) => set({ selectedGroup: group, groupMessages: [] }),

  fetchGroupMessages: async (groupId) => {
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch {
      toast.error("Failed to load messages");
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/send`, messageData);
      // Real-time update comes via socket — no need to manually append here
    } catch {
      toast.error("Failed to send message");
    }
  },

  createGroup: async (name, memberIds) => {
    try {
      const res = await axiosInstance.post("/groups/create", { name, memberIds });
      set((state) => ({ groups: [res.data.group, ...state.groups] }));
      toast.success("Group created!");
      return res.data.group;
    } catch {
      toast.error("Failed to create group");
    }
  },

  // Bug fix: avatar is now passed through and uploaded on the backend
  updateGroup: async (groupId, data) => {
    try {
      const res = await axiosInstance.patch(`/groups/${groupId}/update`, data);
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data.group : g)),
        selectedGroup:
          state.selectedGroup?._id === groupId ? res.data.group : state.selectedGroup,
      }));
      toast.success("Group updated");
    } catch {
      toast.error("Update failed");
    }
  },

  addMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/add-member`, { userId });
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data.group : g)),
        selectedGroup:
          state.selectedGroup?._id === groupId ? res.data.group : state.selectedGroup,
      }));
      toast.success("Member added");
    } catch {
      toast.error("Failed to add member");
    }
  },

  removeMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/remove-member`, { userId });
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data.group : g)),
        selectedGroup:
          state.selectedGroup?._id === groupId ? res.data.group : state.selectedGroup,
      }));
    } catch {
      toast.error("Failed to remove member");
    }
  },

  makeAdmin: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/make-admin`, { userId });
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data.group : g)),
        selectedGroup:
          state.selectedGroup?._id === groupId ? res.data.group : state.selectedGroup,
      }));
      toast.success("Admin assigned");
    } catch {
      toast.error("Failed");
    }
  },

  deleteGroupMessage: async (msgId) => {
    try {
      await axiosInstance.delete("/groups/delete-message", { data: { id: msgId } });
      set((state) => ({
        groupMessages: state.groupMessages.map((m) =>
          m._id === msgId ? { ...m, isDeleted: true } : m
        ),
      }));
    } catch {
      toast.error("Delete failed");
    }
  },

  listenGroupEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Always clear before re-binding to avoid duplicate listeners (Bug 2 fix)
    socket.off("group:newMessage");
    socket.off("group:updated");
    socket.off("group:new");
    socket.off("group:removed");
    socket.off("group:messageDeleted");
    socket.off("group:reactionUpdate");

    // Bug 1 fix: use .toString() on both sides — groupId from server is an ObjectId string,
    // selectedGroup._id from the store is also a string, but comparing with === can fail
    // if one side is an ObjectId object. Always coerce with toString().
    socket.on("group:newMessage", (msg) => {
      const { selectedGroup } = get();
      if (selectedGroup && msg.groupId?.toString() === selectedGroup._id?.toString()) {
        set((state) => ({
          groupMessages: [...state.groupMessages, msg],
        }));
      }
      // Bug 1 fix part 2: use state.groups inside set(), not a closure variable
      set((state) => ({
        groups: state.groups.map((g) =>
          g._id?.toString() === msg.groupId?.toString()
            ? { ...g, lastMessage: msg.text || "media", lastMessageTime: new Date() }
            : g
        ),
      }));
    });

    socket.on("group:updated", (updatedGroup) => {
      set((state) => ({
        groups: state.groups.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)),
        selectedGroup:
          state.selectedGroup?._id === updatedGroup._id ? updatedGroup : state.selectedGroup,
      }));
    });

    socket.on("group:new", (group) => {
      set((state) => {
        const exists = state.groups.find((g) => g._id === group._id);
        if (exists) return {};
        // Join the socket room for the new group
        useAuthStore.getState().socket?.emit("group:joinRoom", { groupId: group._id });
        return { groups: [group, ...state.groups] };
      });
    });

    socket.on("group:removed", ({ groupId }) => {
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
      toast("You were removed from a group");
    });

    socket.on("group:messageDeleted", (msgId) => {
      set((state) => ({
        groupMessages: state.groupMessages.map((m) =>
          m._id === msgId ? { ...m, isDeleted: true } : m
        ),
      }));
    });

    socket.on("group:reactionUpdate", ({ messageId, reactions }) => {
      set((state) => ({
        groupMessages: state.groupMessages.map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        ),
      }));
    });
  },

  unlistenGroupEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    [
      "group:newMessage",
      "group:updated",
      "group:new",
      "group:removed",
      "group:messageDeleted",
      "group:reactionUpdate",
    ].forEach((ev) => socket.off(ev));
  },
}));