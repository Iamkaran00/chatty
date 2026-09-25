import React, { useState, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import img from "../assets/smartboy.jpg";
import { Crown, UserMinus, UserPlus, Edit2, Check, Camera, Loader2 } from "lucide-react";

const STYLES = `
  .gi-panel { background: #15161D; border-left: 1px solid rgba(255,255,255,0.06); font-family: 'Plus Jakarta Sans', sans-serif; }
  .gi-header { border-bottom: 1px solid rgba(255,255,255,0.06); }
  .gi-section { border-bottom: 1px solid rgba(255,255,255,0.06); }
  .gi-label { font-size: 11px; font-weight: 600; color: #6B6B7A; text-transform: uppercase; letter-spacing: 0.7px; }
  .gi-name-input {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
    padding: 6px 10px; color: #E2E2EE; font-size: 13px; outline: none; flex: 1;
  }
  .gi-icon-btn {
    background: transparent; border: none; border-radius: 999px; width: 26px; height: 26px;
    display: flex; align-items: center; justify-content: center; color: #B8B8CC; cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .gi-icon-btn:hover { background: rgba(255,255,255,0.08); }
  .gi-icon-btn.danger:hover { background: rgba(239,68,68,0.15); color: #F87171; }
  .gi-member-row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 12px; transition: background 0.15s; }
  .gi-member-row:hover { background: rgba(255,255,255,0.04); }
  .gi-add-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 9px 0; border-radius: 10px; border: 1px dashed rgba(255,255,255,0.18);
    color: #B8B8CC; font-size: 13px; font-weight: 500; background: transparent; cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .gi-add-btn:hover { background: rgba(255,255,255,0.05); border-color: rgba(139,106,245,0.4); }
  .gi-dropdown { background: #1E1F28; border: 1px solid rgba(255,255,255,0.1); }
`;

const GroupInfoPanel = ({ onClose }) => {
  const { selectedGroup, updateGroup, addMember, removeMember, makeAdmin, setSelectedGroup } = useGroupStore();
  const { authUser } = useAuthStore();
  const { users } = useChatStore();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(selectedGroup?.name || "");
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const avatarInputRef = useRef(null);

  if (!selectedGroup) return null;

  const isAdmin = selectedGroup.admins?.some((a) => (a._id || a).toString() === authUser?._id?.toString());
  const memberIds = selectedGroup.members.map((m) => (m._id || m).toString());
  const nonMembers = users.filter((u) => !memberIds.includes(u._id.toString()));

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      // Fixed: no error handling previously — a failed upload left
      // uploadingAvatar stuck true forever with no feedback.
      try {
        await updateGroup(selectedGroup._id, { avatar: reader.result });
      } catch (err) {
        toast.error("Couldn't update the group photo");
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.onerror = () => {
      toast.error("Couldn't read that image");
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  // Fixed: leaving a group (self-remove) previously left the panel and
  // ChatContainer pointed at a group you're no longer in.
  const handleLeave = async (memberId) => {
    await removeMember(selectedGroup._id, memberId);
    setSelectedGroup(null);
    onClose();
  };

  return (
    <div className="gi-panel w-72 h-full flex flex-col overflow-y-auto">
      <style>{STYLES}</style>

      <div className="gi-header p-4 flex items-center justify-between">
        <span className="font-semibold" style={{ color: "#E2E2EE" }}>Group info</span>
        <button className="gi-icon-btn" onClick={onClose}>✕</button>
      </div>

      <div className="gi-section flex flex-col items-center gap-3 py-6">
        <div className="relative">
          <div
            className="size-20 rounded-full flex items-center justify-center font-bold text-3xl uppercase overflow-hidden"
            style={{ background: "rgba(124,106,245,0.18)", color: "#A78BFA" }}
          >
            {selectedGroup.avatar ? <img src={selectedGroup.avatar} className="size-20 rounded-full object-cover" alt="group" /> : selectedGroup.name?.[0]}
          </div>
          {isAdmin && (
            <>
              <input type="file" accept="image/*" hidden ref={avatarInputRef} onChange={handleAvatarChange} />
              <button
                className="absolute bottom-0 right-0 rounded-full flex items-center justify-center shadow"
                style={{ width: 24, height: 24, background: "#7C6AF5" }}
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Change group photo"
              >
                {uploadingAvatar ? <Loader2 size={12} className="animate-spin text-white" /> : <Camera size={12} className="text-white" />}
              </button>
            </>
          )}
        </div>
        {uploadingAvatar && <span className="text-xs" style={{ color: "#7B7B9A" }}>Uploading photo…</span>}
      </div>

      <div className="gi-section p-4">
        {editingName ? (
          <div className="flex gap-2">
            <input
              className="gi-name-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { updateGroup(selectedGroup._id, { name: newName }); setEditingName(false); }
              }}
              autoFocus
            />
            <button
              className="gi-icon-btn"
              style={{ background: "#7C6AF5", color: "#fff" }}
              onClick={() => { updateGroup(selectedGroup._id, { name: newName }); setEditingName(false); }}
            >
              <Check className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: "#E2E2EE" }}>{selectedGroup.name}</span>
            {isAdmin && <button className="gi-icon-btn" onClick={() => setEditingName(true)}><Edit2 className="size-3" /></button>}
          </div>
        )}
        <p className="text-xs mt-1" style={{ color: "#6B6B7A" }}>{selectedGroup.members?.length} members</p>
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <p className="gi-label mb-2">Members</p>

        {selectedGroup.members?.map((member) => {
          const memberId = (member._id || member).toString();
          const isThisAdmin = selectedGroup.admins?.some((a) => (a._id || a).toString() === memberId);
          const isMe = memberId === authUser?._id?.toString();

          return (
            <div key={memberId} className="gi-member-row">
              <img src={member.profilePic || img} className="size-8 rounded-full object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#E2E2EE" }}>{member.fullName || "Member"}</p>
                {isThisAdmin && <p className="text-xs" style={{ color: "#A78BFA" }}>Admin</p>}
              </div>

              {isAdmin && !isMe && (
                <div className="flex gap-1">
                  {!isThisAdmin && (
                    <button className="gi-icon-btn" title="Make admin" onClick={() => makeAdmin(selectedGroup._id, memberId)}>
                      <Crown className="size-3" />
                    </button>
                  )}
                  <button className="gi-icon-btn danger" title="Remove member" onClick={() => removeMember(selectedGroup._id, memberId)}>
                    <UserMinus className="size-3" />
                  </button>
                </div>
              )}

              {isMe && !isAdmin && (
                <button className="text-xs font-medium" style={{ color: "#F87171" }} onClick={() => handleLeave(memberId)}>
                  Leave
                </button>
              )}
            </div>
          );
        })}

        {isAdmin && nonMembers.length > 0 && (
          <div className="mt-3 relative">
            <button className="gi-add-btn" onClick={() => setShowAddDropdown(!showAddDropdown)}>
              <UserPlus className="size-4" /> Add member
            </button>
            {showAddDropdown && (
              <div className="gi-dropdown absolute bottom-full mb-1 w-full rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                {nonMembers.map((u) => (
                  <button
                    key={u._id}
                    className="flex items-center gap-2 w-full p-2 text-left"
                    style={{ color: "#E2E2EE" }}
                    onClick={() => { addMember(selectedGroup._id, u._id); setShowAddDropdown(false); }}
                  >
                    <img src={u.profilePic || img} className="size-7 rounded-full object-cover" alt="" />
                    <span className="text-sm">{u.fullName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupInfoPanel;