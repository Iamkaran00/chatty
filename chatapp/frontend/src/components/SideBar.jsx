import React, { useEffect, useState } from "react";
import { Users, MessageSquare, Plus } from "lucide-react";
import img from "../assets/smartboy.jpg";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import CreateGroupModal from "./CreateGroupModal";

const STYLES = `
  .sb-root { background: var(--cc-bg, #0E0F14); font-family: 'Plus Jakarta Sans', sans-serif; }
  .sb-tabs { border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
  .sb-tab {
    flex: 1; padding: 8px 0; font-size: 13px; font-weight: 600;
    color: #7B7B9A; background: transparent; transition: background 0.15s, color 0.15s;
  }
  .sb-tab.active { background: linear-gradient(135deg,#5B6AF5 0%,#8B5CF6 100%); color: #fff; }
  .sb-tab:not(.active):hover { background: rgba(255,255,255,0.05); color: #E2E2EE; }
  .sb-row {
    display: flex; align-items: center; gap: 12px; width: 100%;
    padding: 10px 12px; border-radius: 14px; text-align: left;
    background: transparent; border: 1px solid transparent; transition: background 0.15s, border-color 0.15s;
  }
  .sb-row:hover { background: rgba(255,255,255,0.04); }
  .sb-row.active { background: rgba(139,106,245,0.12); border-color: rgba(139,106,245,0.3); }
  .sb-name { color: #E2E2EE; font-weight: 500; font-size: 14px; }
  .sb-sub { color: #7B7B9A; font-size: 12px; }
  .sb-new-btn {
    margin-top: 12px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 8px 0; border-radius: 10px; border: 1px dashed rgba(255,255,255,0.18);
    color: #B8B8CC; font-size: 13px; font-weight: 500; background: transparent; transition: background 0.15s, border-color 0.15s;
  }
  .sb-new-btn:hover { background: rgba(255,255,255,0.05); border-color: rgba(139,106,245,0.4); }
  .sb-scroll::-webkit-scrollbar { width: 4px; }
  .sb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const SideBar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { groups, fetchGroups, selectedGroup, setSelectedGroup, isLoading: isGroupsLoading } = useGroupStore();
  const { onlineUsers } = useAuthStore();

  const [activeTab, setActiveTab] = useState("dms");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fixed: previously fetched groups both on mount AND every time the
  // "groups" tab was selected, causing a redundant duplicate request
  // the first time someone switched tabs. Fetch once on mount only.
  useEffect(() => {
    getUsers();
    fetchGroups();
  }, []);

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
    <aside className="sb-root h-full w-20 lg:w-72 border-r flex flex-col overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <style>{STYLES}</style>

      <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 mb-4">
          {activeTab === "dms" ? <MessageSquare className="size-5" color="#E2E2EE" /> : <Users className="size-5" color="#E2E2EE" />}
          <span className="font-medium hidden lg:block" style={{ color: "#E2E2EE" }}>
            {activeTab === "dms" ? "Messages" : "Groups"}
          </span>
        </div>

        <div className="flex sb-tabs">
          <button onClick={() => setActiveTab("dms")} className={`sb-tab ${activeTab === "dms" ? "active" : ""}`}>DMs</button>
          <button onClick={() => setActiveTab("groups")} className={`sb-tab ${activeTab === "groups" ? "active" : ""}`}>Groups</button>
        </div>

        {activeTab === "groups" && (
          <button onClick={() => setShowCreateModal(true)} className="sb-new-btn">
            <Plus className="size-4" /> New group
          </button>
        )}

        {activeTab === "dms" && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm" style={{ color: "#B8B8CC" }}>Online only</span>
            </label>
            <span className="text-xs" style={{ color: "#7B7B9A" }}>
              ({Math.max(onlineUsers.length - 1, 0)} online)
            </span>
          </div>
        )}
      </div>

      <div className="sb-scroll flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
        {activeTab === "dms" && (
          isUsersLoading ? (
            <div className="flex justify-center py-8"><span className="loading loading-spinner loading-md" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-6 text-sm" style={{ color: "#7B7B9A" }}>No users found</div>
          ) : (
            filteredUsers.map((user) => {
              const isOnline = onlineUsers.includes(user._id);
              return (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className={`sb-row ${selectedUser?._id === user._id ? "active" : ""}`}
                >
                  <div className="relative shrink-0">
                    <img src={user.profilePic || img} alt={user.fullName} className="size-11 rounded-full object-cover" />
                    {isOnline && (
                      <span
                        className="absolute bottom-0 right-0 size-3 rounded-full"
                        style={{ background: "#34D399", border: "2px solid #0E0F14" }}
                      />
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col flex-1 min-w-0 text-left">
                    <span className="sb-name truncate">{user.fullName}</span>
                    <span className="sb-sub truncate">{user.lastMessage || (isOnline ? "Online" : "Offline")}</span>
                  </div>
                  {user.unreadCount > 0 && (
                    <span
                      className="shrink-0 rounded-full text-xs font-semibold flex items-center justify-center"
                      style={{ background: "#7C6AF5", color: "#fff", minWidth: 20, height: 20, padding: "0 6px" }}
                    >
                      {user.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )
        )}

        {activeTab === "groups" && (
          isGroupsLoading ? (
            <div className="flex justify-center py-8"><span className="loading loading-spinner loading-md" /></div>
          ) : groups.length === 0 ? (
            <div className="text-center py-6 text-sm" style={{ color: "#7B7B9A" }}>No groups yet — create one above</div>
          ) : (
            groups.map((group) => {
              const memberCount = group.members?.length ?? 0;
              return (
                <button
                  key={group._id}
                  onClick={() => handleSelectGroup(group)}
                  className={`sb-row ${selectedGroup?._id === group._id ? "active" : ""}`}
                >
                  <div
                    className="shrink-0 size-11 rounded-full flex items-center justify-center font-bold text-base uppercase overflow-hidden"
                    style={{ background: "rgba(124,106,245,0.18)", color: "#A78BFA" }}
                  >
                    {group.avatar ? <img src={group.avatar} className="size-11 rounded-full object-cover" alt="" /> : (group.name?.[0] ?? "G")}
                  </div>
                  <div className="hidden lg:flex flex-col flex-1 min-w-0 text-left">
                    <span className="sb-name truncate">{group.name}</span>
                    <span className="sb-sub truncate">{group.lastMessage || `${memberCount} members`}</span>
                  </div>
                </button>
              );
            })
          )
        )}
      </div>

      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
    </aside>
  );
};

export default SideBar;