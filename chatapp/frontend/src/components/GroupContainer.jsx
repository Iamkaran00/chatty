import React, { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import img from "../assets/smartboy.jpg";
import { formatMessageTime } from "../lib/utils";
import toast from "react-hot-toast";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import GroupInfoPanel from "./GroupInfoPanel";
import { Users, X, Send, Image as ImageIcon, Film, Mic, Square, Loader2 } from "lucide-react";

const STYLES = `
  :root {
    --cc-bg: #0E0F14; --cc-surface: #15161D;
    --cc-border: rgba(255,255,255,0.06);
    --cc-mine: linear-gradient(135deg,#5B6AF5 0%,#8B5CF6 100%);
    --cc-theirs: #1E1F28; --cc-accent: #7C6AF5;
    --cc-text: #E2E2EE; --cc-muted: #7B7B9A;
    --cc-font: 'Plus Jakarta Sans', sans-serif;
    --cc-display: 'Clash Display', sans-serif;
  }
  .cc-scroll::-webkit-scrollbar { width: 4px; }
  .cc-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  @keyframes cc-fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .cc-msg { animation: cc-fadeUp 0.22s ease both; width: 100%; }
  .cc-reaction { transition: transform 0.15s ease; }
  .cc-reaction:hover { transform: scale(1.2); }
  .cc-msg .cc-actions { opacity: 0; transition: opacity 0.2s, transform 0.2s; pointer-events: none; transform: translateY(-50%) scale(0.95); }
  .cc-msg:hover .cc-actions { opacity: 1; pointer-events: all; transform: translateY(-50%) scale(1); }
  .cc-action-btn { transition: background 0.15s, color 0.15s; }
  .cc-action-btn:hover { background: rgba(255,255,255,0.1); }
  .cc-action-btn.delete-btn:hover { background: rgba(239,68,68,0.2); color: #EF4444; }
`;

const ReactionPicker = ({ onPick }) => (
  <div style={{
    position: "absolute", bottom: "calc(100% + 12px)", right: 0,
    background: "#15161D", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 14, padding: "8px 12px",
    display: "flex", gap: 8, zIndex: 50,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  }}>
    {["😂", "😔", "🔥", "❤️", "👍"].map((e) => (
      <button key={e} className="cc-reaction"
        onClick={() => onPick(e)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 2 }}
      >{e}</button>
    ))}
  </div>
);

// ─── Inline group message input (no monkey-patching) ─────────────────────────
const GroupMessageInput = ({ groupId }) => {
  const { sendGroupMessage } = useGroupStore();
  const { socket, authUser } = useAuthStore();

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("video/")) { toast.error("Select a video file"); return; }
    const reader = new FileReader();
    reader.onload = () => setVideoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeMedia = () => { setImagePreview(null); setVideoPreview(null); };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((p) => p + 1), 1000);
    } catch { toast.error("Mic permission denied"); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const cancelAudio = () => { setAudioPreview(null); setAudioBlob(null); setRecordingDuration(0); };

  const blobToBase64 = (blob) => new Promise((res) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.readAsDataURL(blob);
  });

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !videoPreview && !audioBlob) return;
    setIsSending(true);
    try {
      let audioBase64 = null;
      if (audioBlob) audioBase64 = await blobToBase64(audioBlob);
      await sendGroupMessage(groupId, { text, image: imagePreview, video: videoPreview, audio: audioBase64 });
      setText("");
      removeMedia();
      cancelAudio();
    } finally {
      setIsSending(false);
    }
  };

  const hasMedia = imagePreview || videoPreview;

  return (
    <div className="p-4 bg-base-100 border-t border-base-300 w-full relative z-10">
      {/* Media preview */}
      {hasMedia && (
        <div className="mb-3 flex items-center gap-3">
          <div className="relative group inline-block">
            {imagePreview && <img src={imagePreview} alt="Preview" className="h-28 w-auto rounded-xl object-cover border border-base-300" />}
            {videoPreview && <video src={videoPreview} controls className="h-28 w-auto rounded-xl border border-base-300 bg-black" />}
            <button onClick={removeMedia} className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {/* Audio preview */}
      {audioPreview && (
        <div className="mb-3 flex items-center gap-3 p-2 bg-base-200/50 rounded-xl border border-base-300 w-fit">
          <audio src={audioPreview} controls className="h-10" />
          <button onClick={cancelAudio} className="btn btn-circle btn-xs btn-error"><X size={14} /></button>
        </div>
      )}
      <form onSubmit={handleSend} className="flex gap-2 items-end">
        <input type="file" accept="image/*" hidden ref={imageInputRef} onChange={handleImageChange} />
        <input type="file" accept="video/*" hidden ref={videoInputRef} onChange={handleVideoChange} />
        <div className="flex-1 flex items-center gap-1 bg-base-200/50 hover:bg-base-200 focus-within:bg-base-200 border border-transparent focus-within:border-primary/20 rounded-3xl px-2 py-1.5 transition-all">
          <input
            className="flex-1 bg-transparent text-sm outline-none px-3 py-2 placeholder:text-base-content/50"
            placeholder="Message group..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSending}
          />
          {!hasMedia && !audioPreview && (
            <div className="flex items-center gap-1 pr-1 text-base-content/60">
              <button type="button" onClick={() => imageInputRef.current?.click()} className="btn btn-circle btn-sm btn-ghost hover:text-primary hover:bg-base-300">
                <ImageIcon size={20} />
              </button>
              <button type="button" onClick={() => videoInputRef.current?.click()} className="btn btn-circle btn-sm btn-ghost hover:text-primary hover:bg-base-300">
                <Film size={20} />
              </button>
              {!isRecording ? (
                <button type="button" onClick={startRecording} className="btn btn-circle btn-sm btn-ghost hover:text-primary hover:bg-base-300">
                  <Mic size={20} />
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-error/10 px-3 py-1 rounded-full ml-1">
                  <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  <span className="text-xs font-medium text-error min-w-[36px]">{formatTime(recordingDuration)}</span>
                  <button type="button" onClick={stopRecording} className="text-error">
                    <Square size={16} fill="currentColor" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isSending || (!text.trim() && !hasMedia && !audioBlob)}
          className="btn btn-primary btn-circle shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 mb-1"
        >
          {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
        </button>
      </form>
    </div>
  );
};

// ─── Main GroupChatContainer ──────────────────────────────────────────────────
const GroupChatContainer = () => {
  const {
    selectedGroup, groupMessages, fetchGroupMessages,
    deleteGroupMessage, listenGroupEvents, unlistenGroupEvents,
  } = useGroupStore();
  const { authUser, socket } = useAuthStore();

  const messageRef = useRef(null);
  const [openReaction, setOpenReaction] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Bug 2 fix: only call listenGroupEvents here, not also in connectSocket
  useEffect(() => {
    listenGroupEvents();
    return () => { unlistenGroupEvents(); };
  }, []);

  useEffect(() => {
    if (!selectedGroup?._id) return;
    fetchGroupMessages(selectedGroup._id);
  }, [selectedGroup?._id]);

  // Join/leave the socket room when selected group changes
  useEffect(() => {
    if (!socket || !selectedGroup?._id) return;
    socket.emit("group:joinRoom", { groupId: selectedGroup._id });
    return () => { socket.emit("group:leaveRoom", { groupId: selectedGroup._id }); };
  }, [socket, selectedGroup?._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messageRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const reactToMessage = (messageId, emoji) => {
    socket?.emit("group:react", { messageId, emoji, groupId: selectedGroup._id });
  };

  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href, download: filename });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(href);
    } catch { toast.error("Download failed"); }
  };

  if (!selectedGroup) return null;

  // Bug 5 fix: always use .toString() on both sides for ObjectId safety
  const isAdmin = selectedGroup.admins?.some(
    (a) => (a._id || a).toString() === authUser?._id?.toString()
  );

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden", background: "var(--cc-bg)" }}>
        {/* Main chat column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div className="p-2.5 border-b border-base-300 bg-base-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg uppercase shrink-0">
                  {selectedGroup.avatar
                    ? <img src={selectedGroup.avatar} className="size-10 rounded-full object-cover" alt="" />
                    : selectedGroup.name?.[0]}
                </div>
                <div>
                  <h3 className="font-medium text-base-content">{selectedGroup.name}</h3>
                  <p className="text-sm text-base-content/60">
                    {selectedGroup.members?.length} members
                    {isAdmin && <span className="ml-2 text-primary text-xs">· Admin</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost btn-sm btn-circle tooltip tooltip-left"
                  data-tip="Group info"
                  onClick={() => setShowInfo((v) => !v)}
                >
                  <Users className="size-5" />
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={() => useGroupStore.getState().setSelectedGroup(null)}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            className="cc-scroll"
            style={{
              flex: 1, overflowY: "auto", padding: "20px 16px",
              display: "flex", flexDirection: "column", gap: 12,
            }}
          >
            {groupMessages.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div style={{ fontSize: 48, opacity: 0.3 }}>💬</div>
                <p style={{ color: "var(--cc-muted)", fontSize: 14 }}>No messages yet — say hi 👋</p>
              </div>
            ) : (
              groupMessages.map((m, idx) => {
                const senderId = m.senderId?._id || m.senderId;
                const mine = senderId?.toString() === authUser?._id?.toString();
                const senderName = m.senderId?.fullName || "";
                const senderPic = m.senderId?.profilePic || img;

                return (
                  <div
                    key={m._id}
                    className="cc-msg"
                    style={{
                      display: "flex",
                      flexDirection: mine ? "row-reverse" : "row",
                      alignItems: "flex-end",
                      gap: 10,
                      marginBottom: 6,
                      animationDelay: `${Math.min(idx * 0.03, 0.3)}s`,
                      position: "relative",
                    }}
                  >
                    <img
                      src={mine ? authUser.profilePic || img : senderPic}
                      alt="avatar"
                      style={{
                        width: 34, height: 34, borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.08)",
                        objectFit: "cover", flexShrink: 0, alignSelf: "flex-end",
                      }}
                    />

                    <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", maxWidth: "70%", position: "relative" }}>
                      {!mine && (
                        <span style={{ fontSize: 11, color: "var(--cc-accent)", fontWeight: 600, marginBottom: 2 }}>
                          {senderName}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: "var(--cc-muted)", marginBottom: 4 }}>
                        {formatMessageTime(m.createdAt)}
                      </span>

                      {m.image && !m.isDeleted && (
                        <div style={{ position: "relative", display: "inline-block", marginBottom: 4 }}>
                          <Zoom>
                            <img src={m.image} alt="attachment" style={{ maxWidth: 220, borderRadius: 14, display: "block" }} />
                          </Zoom>
                          <div style={{ position: "absolute", top: 8, right: 8 }}>
                            <button
                              onClick={() => handleDownload(m.image, "group-image.jpg")}
                              style={{
                                background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
                                color: "#fff", border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer",
                              }}
                            >⬇ Save</button>
                          </div>
                        </div>
                      )}

                      {m.video && !m.isDeleted && (
                        <video src={m.video} controls style={{ maxWidth: 300, borderRadius: 14, marginBottom: 4 }} />
                      )}
                      {m.audio && !m.isDeleted && (
                        <audio src={m.audio} controls style={{ height: 36, width: 240, marginBottom: 4 }} />
                      )}
                      {m.gif && !m.isDeleted && (
                        <img src={m.gif} alt="gif" style={{ maxWidth: 220, borderRadius: 14, marginBottom: 4 }} />
                      )}

                      {(m.text || m.isDeleted) && (
                        <div style={{
                          background: m.isDeleted ? "rgba(255,255,255,0.08)"
                            : mine ? "var(--cc-mine)" : "var(--cc-theirs)",
                          borderRadius: mine ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                          padding: "10px 14px",
                          boxShadow: mine ? "0 4px 20px rgba(92,92,245,0.25)" : "none",
                          border: m.isDeleted ? "1px dashed rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.02)",
                        }}>
                          {m.isDeleted ? (
                            <span style={{ color: "#A0A0B0", fontStyle: "italic", fontSize: 13 }}>
                              This message was deleted
                            </span>
                          ) : (
                            <p style={{ margin: 0, fontSize: 14, color: mine ? "#FFFFFF" : "var(--cc-text)", lineHeight: 1.55 }}>
                              {m.text}
                            </p>
                          )}
                        </div>
                      )}

                      {m.reactions?.length > 0 && !m.isDeleted && (
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                          {m.reactions.map((r, i) => (
                            <span key={i} className="cc-reaction" style={{
                              background: "rgba(255,255,255,0.1)", borderRadius: 100,
                              padding: "2px 8px", fontSize: 13,
                              border: "1px solid rgba(255,255,255,0.15)",
                            }}>{r.emoji}</span>
                          ))}
                        </div>
                      )}

                      {!m.isDeleted && (
                        <div className="cc-actions" style={{
                          position: "absolute", top: "50%",
                          [mine ? "right" : "left"]: "calc(100% + 12px)",
                          display: "flex", gap: 4,
                          background: "#15161D",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "20px", padding: "4px 6px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.4)", zIndex: 10,
                        }}>
                          <button className="cc-action-btn"
                            onClick={() => setOpenReaction(openReaction === m._id ? null : m._id)}
                            style={{
                              background: "transparent", border: "none", borderRadius: "50%",
                              width: 28, height: 28, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                            }}
                          >😊</button>
                          {mine && (
                            <button className="cc-action-btn delete-btn"
                              onClick={() => deleteGroupMessage(m._id)}
                              style={{
                                background: "transparent", border: "none", borderRadius: "50%",
                                width: 28, height: 28, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#A0A0B0",
                              }}
                            >🗑</button>
                          )}
                        </div>
                      )}

                      {openReaction === m._id && (
                        <ReactionPicker onPick={(emoji) => { reactToMessage(m._id, emoji); setOpenReaction(null); }} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messageRef} style={{ height: 1 }} />
          </div>

          {/* Bug 4 fix: use our own GroupMessageInput instead of monkey-patching useChatStore */}
          <GroupMessageInput groupId={selectedGroup._id} />
        </div>

        {/* Info panel */}
        {showInfo && <GroupInfoPanel onClose={() => setShowInfo(false)} />}
      </div>
    </>
  );
};

export default GroupChatContainer;