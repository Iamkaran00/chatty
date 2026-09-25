import React, { useState, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import img from "../assets/smartboy.jpg";
import { Crown, UserMinus, UserPlus, Edit2, Check, Camera, Loader2 } from "lucide-react";

const GroupInfoPanel = ({ onClose }) => {
  const { selectedGroup, updateGroup, addMember, removeMember, makeAdmin } = useGroupStore();
  const { authUser } = useAuthStore();
  const { users } = useChatStore();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(selectedGroup?.name || "");
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const avatarInputRef = useRef(null);

  if (!selectedGroup) return null;

  // Bug 5 fix: always use .toString() for ObjectId comparison
  const isAdmin = selectedGroup.admins?.some(
    (a) => (a._id || a).toString() === authUser?._id?.toString()
  );
  const memberIds = selectedGroup.members.map((m) => (m._id || m).toString());
  const nonMembers = users.filter((u) => !memberIds.includes(u._id.toString()));

  // ── Group avatar upload ──────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        // Send base64 to backend — updateGroup controller uploads to cloudinary
        await updateGroup(selectedGroup._id, { avatar: reader.result });
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="w-72 h-full border-l border-base-300 flex flex-col bg-base-100 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-base-300 flex items-center justify-between">
        <span className="font-semibold">Group info</span>
        <button className="btn btn-ghost btn-xs btn-circle" onClick={onClose}>✕</button>
      </div>

      {/* ── Group Avatar ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 py-6 border-b border-base-300">
        <div className="relative">
          <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl uppercase overflow-hidden">
            {selectedGroup.avatar
              ? <img src={selectedGroup.avatar} className="size-20 rounded-full object-cover" alt="group" />
              : selectedGroup.name?.[0]}
          </div>
          {/* Only admins can change the photo */}
          {isAdmin && (
            <>
              <input
                type="file"
                accept="image/*"
                hidden
                ref={avatarInputRef}
                onChange={handleAvatarChange}
              />
              <button
                className="absolute bottom-0 right-0 btn btn-circle btn-xs btn-primary shadow"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                title="Change group photo"
              >
                {uploadingAvatar
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Camera size={12} />}
              </button>
            </>
          )}
        </div>
        {uploadingAvatar && (
          <span className="text-xs text-zinc-400">Uploading photo…</span>
        )}
      </div>

      {/* ── Group Name ───────────────────────────────────────────── */}
      <div className="p-4 border-b border-base-300">
        {editingName ? (
          <div className="flex gap-2">
            <input
              className="input input-bordered input-sm flex-1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateGroup(selectedGroup._id, { name: newName });
                  setEditingName(false);
                }
              }}
              autoFocus
            />
            <button className="btn btn-sm btn-primary" onClick={() => {
              updateGroup(selectedGroup._id, { name: newName });
              setEditingName(false);
            }}><Check className="size-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedGroup.name}</span>
            {isAdmin && (
              <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setEditingName(true)}>
                <Edit2 className="size-3" />
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-zinc-500 mt-1">{selectedGroup.members?.length} members</p>
      </div>

      {/* ── Members List ─────────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">Members</p>

        {selectedGroup.members?.map((member) => {
          const memberId = (member._id || member).toString();
          const isThisAdmin = selectedGroup.admins?.some(
            (a) => (a._id || a).toString() === memberId
          );
          const isMe = memberId === authUser?._id?.toString();

          return (
            <div key={memberId} className="flex items-center gap-2 p-2 rounded-xl hover:bg-base-300">
              <img src={member.profilePic || img} className="size-8 rounded-full object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.fullName || "Member"}</p>
                {isThisAdmin && <p className="text-xs text-primary">Admin</p>}
              </div>

              {/* Admin controls for other members */}
              {isAdmin && !isMe && (
                <div className="flex gap-1">
                  {!isThisAdmin && (
                    <button
                      className="btn btn-ghost btn-xs btn-circle"
                      title="Make admin"
                      onClick={() => makeAdmin(selectedGroup._id, memberId)}
                    >
                      <Crown className="size-3" />
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-xs btn-circle text-error"
                    title="Remove member"
                    onClick={() => removeMember(selectedGroup._id, memberId)}
                  >
                    <UserMinus className="size-3" />
                  </button>
                </div>
              )}

              {/* Non-admin can only leave themselves */}
              {isMe && !isAdmin && (
                <button
                  className="btn btn-ghost btn-xs text-error text-xs"
                  onClick={() => removeMember(selectedGroup._id, memberId)}
                >
                  Leave
                </button>
              )}
            </div>
          );
        })}

        {/* ── Add Member Dropdown ──────────────────────────────── */}
        {isAdmin && nonMembers.length > 0 && (
          <div className="mt-3 relative">
            <button
              className="btn btn-sm btn-outline w-full gap-2"
              onClick={() => setShowAddDropdown(!showAddDropdown)}
            >
              <UserPlus className="size-4" />
              Add member
            </button>
            {showAddDropdown && (
              <div className="absolute bottom-full mb-1 w-full bg-base-200 border border-base-300 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                {nonMembers.map((u) => (
                  <button
                    key={u._id}
                    className="flex items-center gap-2 w-full p-2 hover:bg-base-300 text-left"
                    onClick={() => {
                      addMember(selectedGroup._id, u._id);
                      setShowAddDropdown(false);
                    }}
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