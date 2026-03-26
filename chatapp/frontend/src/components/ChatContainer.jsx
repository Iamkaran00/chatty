import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useWallpaperStore } from "../store/useWallpaper";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeleton/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import img from "../assets/smartboy.jpg";
import toast from "react-hot-toast";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   Inline styles injected once
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Clash+Display:wght@500;600;700&display=swap');

  :root {
    --cc-bg:        #0E0F14;
    --cc-surface:   #15161D;
    --cc-border:    rgba(255,255,255,0.06);
    --cc-mine:      linear-gradient(135deg,#5B6AF5 0%,#8B5CF6 100%);
    --cc-theirs:    #1E1F28;
    --cc-accent:    #7C6AF5;
    --cc-text:      #E2E2EE;
    --cc-muted:     #7B7B9A;
    --cc-green:     #34D399;
    --cc-font:      'Plus Jakarta Sans', sans-serif;
    --cc-display:   'Clash Display', sans-serif;
  }

  /* ── Scroll bar ── */
  .cc-scroll::-webkit-scrollbar { width: 4px; }
  .cc-scroll::-webkit-scrollbar-track { background: transparent; }
  .cc-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  /* ── Fade-up entrance ── */
  @keyframes cc-fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .cc-msg { 
    animation: cc-fadeUp 0.22s ease both; 
    width: 100%; /* Ensures the row takes full width for hover stability */
  }

  /* ── Typing dots ── */
  @keyframes cc-dot {
    0%,80%,100% { transform: scale(0.6); opacity: 0.3; }
    40%         { transform: scale(1);   opacity: 1;   }
  }
  .cc-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--cc-accent); animation: cc-dot 1.4s infinite ease-in-out; }
  .cc-dot:nth-child(2) { animation-delay: 0.2s; }
  .cc-dot:nth-child(3) { animation-delay: 0.4s; }

  /* ── Reaction pill hover ── */
  .cc-reaction { transition: transform 0.15s ease, background 0.15s ease; }
  .cc-reaction:hover { transform: scale(1.2); }

  /* ── Image save overlay ── */
  .cc-img-wrap { position: relative; display: inline-block; }
  .cc-img-save { position: absolute; top: 8px; right: 8px; opacity: 0; transition: opacity 0.18s; }
  .cc-img-wrap:hover .cc-img-save { opacity: 1; }

  /* ── Bubble hover actions (FIXED) ── */
  /* Trigger hover on the entire message row instead of just the bubble to prevent drop-off */
  .cc-msg .cc-actions { opacity: 0; transition: opacity 0.2s, transform 0.2s; pointer-events: none; transform: translateY(-50%) scale(0.95); }
  .cc-msg:hover .cc-actions { opacity: 1; pointer-events: all; transform: translateY(-50%) scale(1); }
  
  /* Make action buttons pop on hover */
  .cc-action-btn { transition: background 0.15s, color 0.15s; }
  .cc-action-btn:hover { background: rgba(255,255,255,0.1); }
  .cc-action-btn.delete-btn:hover { background: rgba(239,68,68,0.2); color: #EF4444; }
`;

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
const RaceCard = ({ roomId, played, onJoin }) => (
  <div style={{
    background: "linear-gradient(135deg,#1a1030 0%,#2a1050 50%,#1a1030 100%)",
    border: "1px solid rgba(139,92,246,0.35)",
    borderRadius: 16,
    padding: "20px 16px",
    width: 260,
    marginBottom: 6,
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 1,
      background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.6),transparent)",
    }} />
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🏎️</div>
      <p style={{ fontFamily: "var(--cc-display)", fontSize: 15, fontWeight: 600, color: "#FFFFFF", margin: "0 0 4px" }}>
        Typing Race
      </p>
      <p style={{ fontSize: 12, color: "var(--cc-muted)", marginBottom: 14 }}>Challenge accepted?</p>
      {played ? (
        <span style={{
          display: "inline-block", background: "rgba(52,211,153,0.15)", color: "#34D399",
          border: "1px solid rgba(52,211,153,0.3)", borderRadius: 100, padding: "4px 14px",
          fontSize: 12, fontWeight: 600,
        }}>Played ✔</span>
      ) : (
        <button onClick={onJoin} style={{
          background: "linear-gradient(135deg,#7C6AF5,#5B6AF5)",
          color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px",
          fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--cc-font)",
          boxShadow: "0 4px 16px rgba(92,92,245,0.35)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(92,92,245,0.45)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(92,92,245,0.35)"; }}
        >
          Join Race →
        </button>
      )}
    </div>
  </div>
);

const WhiteboardCard = ({ roomId, onJoin }) => (
  <div style={{
    background: "linear-gradient(135deg,#0d1f2d 0%,#0d2a3a 50%,#0d1f2d 100%)",
    border: "1px solid rgba(56,189,248,0.25)",
    borderRadius: 16,
    padding: "20px 16px",
    width: 260,
    marginBottom: 6,
    position: "relative",
    overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 1,
      background: "linear-gradient(90deg,transparent,rgba(56,189,248,0.5),transparent)",
    }} />
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 38, marginBottom: 8 }}>🎨</div>
      <p style={{ fontFamily: "var(--cc-display)", fontSize: 15, fontWeight: 600, color: "#FFFFFF", margin: "0 0 4px" }}>
        Whiteboard Invite
      </p>
      <p style={{ fontSize: 12, color: "var(--cc-muted)", marginBottom: 14 }}>Collaborate in real-time</p>
      <button onClick={onJoin} style={{
        background: "linear-gradient(135deg,#0ea5e9,#38bdf8)",
        color: "#fff", border: "none", borderRadius: 10, padding: "8px 20px",
        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--cc-font)",
        boxShadow: "0 4px 16px rgba(14,165,233,0.3)",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
      >
        Open Board →
      </button>
    </div>
  </div>
);

const ReactionPicker = ({ onPick }) => (
  <div style={{
    position: "absolute", bottom: "calc(100% + 12px)", right: 0,
    background: "#15161D", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 14, padding: "8px 12px",
    display: "flex", gap: 8, zIndex: 50,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  }}>
    {["😂", "😔", "🔥", "❤️", "👍"].map(e => (
      <button key={e} className="cc-reaction"
        onClick={() => onPick(e)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 2 }}
      >{e}</button>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const ChatContainer = () => {
  const {
    messages, getMessages, isMessagesLoading,
    markMessageSeen, listenSeen, unlistenSeen,
    selectedUser, listenMessage, unlistenMessage,
    deleteMessage, listenDeleteMessage, unlistenDeleteMessage,
    isTyping, listenTyping, unlistenTyping,
    reactToMessage, listenReaction, unlistenReaction,
    listenWhiteboardInvite, listenWhiteboardCreated, unlistenWhiteboard,
  } = useChatStore();

  const navigate = useNavigate();
  const { authUser, socket } = useAuthStore();
  const { wallpaper } = useWallpaperStore();

  const messageRef = useRef(null);
  const [openReaction, setOpenReaction] = useState(null);

  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    listenSeen(); listenMessage(); listenDeleteMessage(); listenTyping(); listenReaction();
    markMessageSeen(selectedUser._id);
    if (!socket) return;
    return () => { unlistenMessage(); unlistenSeen(); unlistenDeleteMessage(); unlistenTyping(); unlistenReaction(); };
  }, [selectedUser?._id]);

  useEffect(() => {
    if (!socket) return;
    listenWhiteboardInvite(navigate);
    listenWhiteboardCreated(navigate);
    return () => unlistenWhiteboard();
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("racePlayed", ({ roomId }) => {
      useChatStore.setState(state => ({
        messages: state.messages.map(msg =>
          msg.gameRoomId === roomId ? { ...msg, gamePlayed: true } : msg
        ),
      }));
    });
    return () => socket.off("racePlayed");
  }, [socket]);

  useEffect(() => {
    if (messageRef.current) messageRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const bgStyle = wallpaper?.id === selectedUser?._id && wallpaper?.src
    ? { backgroundImage: `url(${wallpaper.src})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};

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

  if (isMessagesLoading) return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--cc-bg)", fontFamily: "var(--cc-font)" }}>
      <ChatHeader />
      <MessageSkeleton />
      <MessageInput />
    </div>
  );

  return (
    <>
      {/* Inject styles once */}
      <style>{STYLES}</style>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: "var(--cc-bg)", fontFamily: "var(--cc-font)",
        position: "relative", overflow: "hidden",
      }}>
        <ChatHeader />

        {/* ── MESSAGES AREA ── */}
        <div
          className="cc-scroll"
          style={{
            flex: 1, overflowY: "auto", padding: "20px 16px",
            display: "flex", flexDirection: "column", gap: 12, // Increased gap slightly for breathing room
            ...bgStyle,
          }}
        >
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ fontSize: 48, opacity: 0.3 }}>💬</div>
              <p style={{ color: "var(--cc-muted)", fontSize: 14, fontWeight: 300 }}>No messages yet — say hi 👋</p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const mine = m.senderId === authUser?._id;
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
                    position: "relative", // Required for the action pill positioning
                  }}
                >
                  {/* Avatar */}
                  <img
                    src={mine ? authUser.profilePic || img : selectedUser.profilePic || img}
                    alt="avatar"
                    style={{
                      width: 34, height: 34, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.08)",
                      objectFit: "cover", flexShrink: 0, alignSelf: "flex-end",
                    }}
                  />

                  {/* Bubble column */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", maxWidth: "70%", position: "relative" }}
                    className="cc-bubble-wrap"
                  >
                    {/* Timestamp */}
                    <span style={{ fontSize: 10, color: "var(--cc-muted)", marginBottom: 4, letterSpacing: "0.3px" }}>
                      {formatMessageTime(m.createdAt)}
                    </span>

                    {/* ── RACE CARD ── */}
                    {m.gameRoomId && !m.isDeleted && (
                      <RaceCard
                        roomId={m.gameRoomId}
                        played={m.gamePlayed}
                        onJoin={() => navigate(`/race/${m.gameRoomId}`)}
                      />
                    )}

                    {/* ── WHITEBOARD CARD ── */}
                    {m.whiteboardRoomId && !m.isDeleted && (
                      <WhiteboardCard
                        roomId={m.whiteboardRoomId}
                        onJoin={() => navigate(`/whiteboard/${m.whiteboardRoomId}`)}
                      />
                    )}

                    {/* ── IMAGE ── */}
                    {m.image && !m.isDeleted && (
                      <div className="cc-img-wrap" style={{ marginBottom: 4 }}>
                        <Zoom>
                          <img src={m.image} alt="attachment" style={{ maxWidth: 220, borderRadius: 14, display: "block" }} />
                        </Zoom>
                        <div className="cc-img-save">
                          <button
                            onClick={() => handleDownload(m.image, "chat-image.jpg")}
                            style={{
                              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
                              color: "#fff", border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: 8, padding: "4px 10px", fontSize: 11,
                              cursor: "pointer", fontFamily: "var(--cc-font)", fontWeight: 500,
                            }}
                          >⬇ Save</button>
                        </div>
                      </div>
                    )}

                    {/* ── VIDEO ── */}
                    {m.video && !m.isDeleted && (
                      <video src={m.video} controls style={{ maxWidth: 300, borderRadius: 14, marginBottom: 4 }} />
                    )}

                    {/* ── AUDIO ── */}
                    {m.audio && !m.isDeleted && (
                      <audio src={m.audio} controls style={{ height: 36, width: 240, marginBottom: 4 }} />
                    )}

                    {/* ── GIF ── */}
                    {m.gif && !m.isDeleted && (
                      <img src={m.gif} alt="gif" style={{ maxWidth: 220, borderRadius: 14, marginBottom: 4 }} />
                    )}

                    {/* ── MAIN BUBBLE ── */}
                    {(m.text || m.isDeleted) && (
                      <div style={{
                        background: m.isDeleted ? "rgba(255,255,255,0.08)" // Increased opacity for readability
                          : mine ? "var(--cc-mine)" : "var(--cc-theirs)",
                        borderRadius: mine ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                        padding: "10px 14px",
                        boxShadow: mine ? "0 4px 20px rgba(92,92,245,0.25)" : "none",
                        border: m.isDeleted ? "1px dashed rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.02)",
                        position: "relative",
                      }}>
                        {m.isDeleted ? (
                          <span style={{ color: "#A0A0B0", fontStyle: "italic", fontSize: 13, fontWeight: 300 }}>
                            This message was deleted
                          </span>
                        ) : (
                          <p style={{
                            margin: 0,
                            fontSize: 14,
                            color: mine ? "#FFFFFF" : "var(--cc-text)", // Stark white for your messages for contrast
                            lineHeight: 1.55,
                            fontWeight: 400
                          }}>
                            {m.text}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ── REACTIONS ROW ── */}
                    {m.reactions?.length > 0 && !m.isDeleted && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {m.reactions.map((r, i) => (
                          <span key={i} className="cc-reaction" style={{
                            background: "rgba(255,255,255,0.1)", borderRadius: 100, // Increased opacity
                            padding: "2px 8px", fontSize: 13,
                            border: "1px solid rgba(255,255,255,0.15)", // Stronger border
                          }}>{r.emoji}</span>
                        ))}
                      </div>
                    )}

                    {/* ── SEEN STATUS ── */}
                    {mine && (
                      <span style={{ fontSize: 10, color: m.isSeen ? "#34D399" : "var(--cc-muted)", marginTop: 4, fontWeight: 500 }}>
                        {m.isSeen ? "Seen ✓" : "Delivered"}
                      </span>
                    )}

                    {/* ── HOVER ACTIONS (SLEEK PILL MENU) ── */}
                    {!m.isDeleted && (
                      <div className="cc-actions" style={{
                        position: "absolute",
                        top: "50%",
                        // This logic pushes the pill OUTSIDE the bubble on the correct side
                        [mine ? "right" : "left"]: "calc(100% + 12px)",
                        display: "flex",
                        gap: 4,
                        background: "#15161D", // Solid sleek background
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "20px", // Pill shape
                        padding: "4px 6px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)", // Nice drop shadow
                        zIndex: 10,
                      }}>
                        {/* Reaction trigger */}
                        <button
                          className="cc-action-btn"
                          onClick={() => setOpenReaction(openReaction === m._id ? null : m._id)}
                          style={{
                            background: "transparent", border: "none",
                            borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 15, color: "#E2E2EE",
                          }}
                          title="React"
                        >😊</button>

                        {/* Delete (own messages only) */}
                        {mine && (
                          <button
                            className="cc-action-btn delete-btn"
                            onClick={() => deleteMessage(m._id)}
                            style={{
                              background: "transparent", border: "none",
                              borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 14, color: "#A0A0B0",
                            }}
                            title="Delete"
                          >🗑</button>
                        )}
                      </div>
                    )}

                    {/* ── REACTION PICKER ── */}
                    {openReaction === m._id && (
                      <ReactionPicker onPick={(emoji) => { reactToMessage(m._id, emoji); setOpenReaction(null); }} />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* ── TYPING INDICATOR ── */}
          {isTyping && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 8 }} className="cc-msg">
              <img src={selectedUser?.profilePic || img} alt="avatar"
                style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)", objectFit: "cover" }}
              />
              <div style={{
                background: "var(--cc-theirs)", borderRadius: "4px 18px 18px 18px",
                padding: "12px 16px", display: "flex", alignItems: "center", gap: 6,
              }}>
                <span className="cc-dot" />
                <span className="cc-dot" />
                <span className="cc-dot" />
              </div>
            </div>
          )}

          <div ref={messageRef} style={{ height: 1 }} />
        </div>

        <MessageInput />
      </div>
    </>
  );
};

export default ChatContainer;