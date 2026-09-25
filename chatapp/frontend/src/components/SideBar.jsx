import React, { useEffect, useState } from "react";
import { Users, MessageSquare, Plus } from "lucide-react";
import SidebarSkeleton from "./skeleton/SideBarSkeleton";
import img from "../assets/smartboy.jpg";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import CreateGroupModal from "./CreateGroupModal";

const SideBar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { groups, fetchGroups, selectedGroup, setSelectedGroup, isLoading: isGroupsLoading } = useGroupStore();
  const { onlineUsers } = useAuthStore();

  const [activeTab, setActiveTab] = useState("dms");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { getUsers(); }, []);
  // Bug 8 fix: fetch groups on initial mount, not just on tab switch
  useEffect(() => { fetchGroups(); }, []);
  useEffect(() => { if (activeTab === "groups") fetchGroups(); }, [activeTab]);

  const filteredUsers = showOnlineOnly
    ? users.filter((u) => onlineUsers.includes(u._id))
    : users;

  const handleSelectUser = (user) => {
    setSelectedGroup(null);
    setSelectedUser(user);
  };

  const handleSelectGroup = (group) => {
    setSelectedUser(null);
    setSelectedGroup(group);
  };

  return (
    <aside className="h-full w-35 lg:w-72 border-r border-base-300 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-3 mb-4">
          {activeTab === "dms"
            ? <MessageSquare className="size-6" />
            : <Users className="size-6" />}
          <span className="font-medium hidden lg:block">
            {activeTab === "dms" ? "Messages" : "Groups"}
          </span>
        </div>

       
        <div className="flex rounded-xl overflow-hidden border border-base-300">
          <button
            onClick={() => setActiveTab("dms")}
            className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "dms"
                ? "bg-primary text-primary-content"
                : "hover:bg-base-300 text-zinc-400"
            }`}
          >
            DMs
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "groups"
                ? "bg-primary text-primary-content"
                : "hover:bg-base-300 text-zinc-400"
            }`}
          >
            Groups
          </button>
        </div>

        {/* Create group button — visible only on groups tab */}
        {activeTab === "groups" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-3 btn btn-sm btn-outline w-full gap-2"
          >
            <Plus className="size-4" /> New group
          </button>
        )}

        {/* Online filter — only for DMs */}
        {activeTab === "dms" && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Online only</span>
            </label>
            <span className="text-xs text-zinc-500">
              ({onlineUsers.length - 1} online)
            </span>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto">
        {/* ── DM tab ── */}
        {activeTab === "dms" && (
          <>
            {isUsersLoading ? (
              <SidebarSkeleton />
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-zinc-500 py-4 text-sm">No users found</div>
            ) : (
              filteredUsers.map((user) => {
                const isOnline = onlineUsers.includes(user._id);
                return (
                  <button
                    key={user._id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full p-3 flex items-center gap-3 rounded-xl hover:bg-base-300 transition ${
                      selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.profilePic || img}
                        alt={user.fullName}
                        className="size-12 rounded-full object-cover"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col flex-1 min-w-0 text-left">
                      <span className="font-medium truncate">{user.fullName}</span>
                      <span className="text-xs text-zinc-400 truncate">
                        {user.lastMessage || (isOnline ? "Online" : "Offline")}
                      </span>
                    </div>
                    {user.unreadCount > 0 && (
                      <span className="badge badge-primary badge-sm shrink-0">
                        {user.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </>
        )}

        {/* ── Groups tab ── */}
        {activeTab === "groups" && (
          <>
            {isGroupsLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center text-zinc-500 py-4 text-sm">
                No groups yet — create one from the navbar
              </div>
            ) : (
              groups.map((group) => {
                const memberCount = group.members?.length ?? 0;
                return (
                  <button
                    key={group._id}
                    onClick={() => handleSelectGroup(group)}
                    className={`w-full p-3 flex items-center gap-3 rounded-xl hover:bg-base-300 transition ${
                      selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""
                    }`}
                  >
                    {/* Group avatar: coloured initial circle */}
                    <div className="shrink-0 size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg uppercase">
                      {group.avatar
                        ? <img src={group.avatar} className="size-12 rounded-full object-cover" alt="" />
                        : group.name?.[0] ?? "G"}
                    </div>
                    <div className="hidden lg:flex flex-col flex-1 min-w-0 text-left">
                      <span className="font-medium truncate">{group.name}</span>
                      <span className="text-xs text-zinc-400 truncate">
                        {group.lastMessage || `${memberCount} members`}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
    </aside>
  );
};

export default SideBar;