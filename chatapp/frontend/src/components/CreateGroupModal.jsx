import React, { useState, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import img from "../assets/smartboy.jpg";

const STYLES = `
  .cg-overlay { background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); }
  .cg-card { background: #15161D; border: 1px solid rgba(255,255,255,0.08); font-family: 'Plus Jakarta Sans', sans-serif; }
  .cg-input {
    width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 10px 14px; color: #E2E2EE; font-size: 14px; outline: none;
    transition: border-color 0.15s;
  }
  .cg-input:focus { border-color: rgba(139,106,245,0.5); }
  .cg-input::placeholder { color: #6B6B7A; }
  .cg-label { font-size: 12px; font-weight: 600; color: #7B7B9A; text-transform: uppercase; letter-spacing: 0.5px; }
  .cg-user-row {
    display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 12px;
    width: 100%; text-align: left; background: transparent; border: 1px solid transparent;
    transition: background 0.15s, border-color 0.15s;
  }
  .cg-user-row:hover { background: rgba(255,255,255,0.05); }
  .cg-user-row.selected { background: rgba(139,106,245,0.12); border-color: rgba(139,106,245,0.35); }
  .cg-checkbox { width: 18px; height: 18px; border-radius: 6px; border: 1.5px solid rgba(255,255,255,0.18); flex-shrink: 0; }
  .cg-checkbox.selected { background: #7C6AF5; border-color: #7C6AF5; }
  .cg-submit {
    width: 100%; padding: 11px 0; border-radius: 12px; border: none; font-weight: 600; font-size: 14px;
    color: #fff; background: linear-gradient(135deg,#7C6AF5,#5B6AF5); cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .cg-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(124,106,245,0.35); }
  .cg-submit:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const CreateGroupModal = ({ onClose }) => {
  const { createGroup } = useGroupStore();
  const { users, getUsers, isUsersLoading } = useChatStore();

  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  // Reuse the already-loaded chat store users instead of firing a
  // second, duplicate request — only fetch if the store is empty.
  useEffect(() => {
    if (users.length === 0) getUsers();
  }, []);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setCreating(true);
    try {
      const group = await createGroup(name.trim(), selected);
      if (group) onClose();
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div
      className="cg-overlay fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{STYLES}</style>
      <div className="cg-card rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#E2E2EE" }}>New group</h2>
          <button onClick={onClose} className="rounded-full p-1.5" style={{ color: "#B8B8CC" }}>
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
          <div className="flex flex-col gap-1.5">
            <label className="cg-label">Group name</label>
            <input
              className="cg-input"
              placeholder="e.g. Weekend plans"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="cg-label">
              Add members{" "}
              {selected.length > 0 && <span style={{ color: "#A78BFA" }}>({selected.length} selected)</span>}
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "#6B6B7A" }} />
              <input
                className="cg-input"
                style={{ paddingLeft: 34 }}
                placeholder="Search people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
              {isUsersLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin" style={{ color: "#7B7B9A" }} /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm py-4" style={{ color: "#6B6B7A" }}>No users found</p>
              ) : (
                filtered.map((u) => {
                  const isSelected = selected.includes(u._id);
                  return (
                    <button key={u._id} type="button" onClick={() => toggle(u._id)} className={`cg-user-row ${isSelected ? "selected" : ""}`}>
                      <img src={u.profilePic || img} className="size-9 rounded-full object-cover shrink-0" alt="" />
                      <span className="text-sm font-medium flex-1 truncate" style={{ color: "#E2E2EE" }}>{u.fullName}</span>
                      <div className={`cg-checkbox flex items-center justify-center ${isSelected ? "selected" : ""}`}>
                        {isSelected && (
                          <svg className="size-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

        <div className="p-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button className="cg-submit" onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || creating}>
            {creating ? (<><Loader2 className="size-4 animate-spin" /> Creating...</>) : (
              `Create group${selected.length > 0 ? ` · ${selected.length} members` : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;