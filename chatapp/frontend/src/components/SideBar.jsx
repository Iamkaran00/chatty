import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Users } from "lucide-react";
import SidebarSkeleton from "./skeleton/SideBarSkeleton";
import img from "../assets/smartboy.jpg";
import { useAuthStore } from "../store/useAuthStore";

const SideBar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();

  const { onlineUsers } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, []);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-35 lg:w-72 border-r border-base-300 flex flex-col overflow-y-auto">

      <div className="border-b border-base-300 w-full p-5">

        <div className="flex items-center gap-3">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        <div className="mt-3 hidden lg:flex items-center gap-2 justify-center">

          <label className="cursor-pointer flex items-center gap-2">

            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />

            <span className="text-sm">show online only</span>

          </label>

          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>

        </div>

      </div>

      <div className="flex flex-col gap-2 p-2">

        {filteredUsers.map((user) => {

          const isOnline = onlineUsers.includes(user._id);

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 rounded-xl hover:bg-base-300 transition
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}
            >

              <div className="relative">

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

                <span className="font-medium truncate">
                  {user.fullName}
                </span>

                <span className="text-sm text-zinc-400">
                  {isOnline ? "online" : "offline"}
                </span>

              </div>

              {user.unreadCount > 0 && (
                <span className="badge badge-primary badge-sm">
                  {user.unreadCount}
                </span>
              )}

            </button>
          );

        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            users not found...
          </div>
        )}

      </div>
    </aside>
  );
};

export default SideBar;