import React, { useState, useEffect } from "react";
import { X, Search, Loader } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { axiosInstance } from "../lib/axios";
import img from "../assets/smartboy.jpg";

const CreateGroupModal = ({ onClose }) => {
  const { createGroup } = useGroupStore();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  // Fetch users directly — don't rely on useChatStore having loaded them
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get("/messages/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to load users for modal:", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, []);

  const toggle = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (selected.length === 0) return;
    setCreating(true);
    try {
      const group = await createGroup(name.trim(), selected);
      if (group) onClose();
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-base-100 rounded-2xl w-full max-w-md shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base-300">
          <h2 className="text-lg font-semibold">New group</h2>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
          {/* Group name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-400">Group name</label>
            <input
              className="input input-bordered w-full"
              placeholder="e.g. Weekend plans"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          {/* Member picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-400">
              Add members{" "}
              {selected.length > 0 && (
                <span className="text-primary">({selected.length} selected)</span>
              )}
            </label>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                className="input input-bordered w-full pl-9"
                placeholder="Search people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* User list */}
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
              {loadingUsers ? (
                <div className="flex justify-center py-6">
                  <Loader className="size-5 animate-spin text-zinc-400" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-zinc-500 text-sm py-4">No users found</p>
              ) : (
                filtered.map((u) => {
                  const isSelected = selected.includes(u._id);
                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => toggle(u._id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition text-left w-full ${
                        isSelected
                          ? "bg-primary/15 ring-1 ring-primary/40"
                          : "hover:bg-base-300"
                      }`}
                    >
                      <img
                        src={u.profilePic || img}
                        className="size-9 rounded-full object-cover shrink-0"
                        alt=""
                      />
                      <span className="text-sm font-medium flex-1 truncate">
                        {u.fullName}
                      </span>
                      {/* Checkbox visual */}
                      <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-zinc-600"
                      }`}>
                        {isSelected && (
                          <svg className="size-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-base-300">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={handleCreate}
            disabled={!name.trim() || selected.length === 0 || creating}
          >
            {creating ? (
              <><Loader className="size-4 animate-spin" /> Creating...</>
            ) : (
              `Create group${selected.length > 0 ? ` · ${selected.length} members` : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;