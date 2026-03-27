 
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Share2, ArrowLeft, Paintbrush, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { lazy, Suspense } from "react";

const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then((mod) => ({
    default: mod.Excalidraw,
  }))
);

const getUserColor = (userId) => {
  if (!userId) return "#6366f1";
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
};


const CursorSVG = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
    style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}>
    <path d="M3 2L17 10L10 12L7 18L3 2Z"
      fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);


const PresenceBar = ({ users, myId }) => {
  if (!users || users.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {users.map((u, i) => {
        const color = getUserColor(u.userId);
        const isMe = u.userId === myId;
        return (
          <div
            key={u.userId}
            title={isMe ? `${u.name} (you)` : u.name}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: `2.5px solid ${color}`,
              overflow: "hidden", cursor: "default",
              position: "relative",
              marginLeft: i > 0 ? "-8px" : 0,
              zIndex: users.length - i,
              boxShadow: "0 0 0 1.5px white",
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15) translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {u.profilePic ? (
              <img src={u.profilePic} alt={u.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{
                width: "100%", height: "100%", background: color,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "sans-serif",
              }}>
                {u.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div style={{
              position: "absolute", bottom: 1, right: 1,
              width: 8, height: 8, background: "#22c55e",
              borderRadius: "50%", border: "1.5px solid white",
            }} />
          </div>
        );
      })}
      <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "sans-serif", marginLeft: 6 }}>
        {users.length} online
      </span>
    </div>
  );
};


const showJoinToast = (name, profilePic, color) => {
  toast.custom((t) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#1e1e2e", color: "#fff",
      padding: "10px 14px", borderRadius: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      fontSize: 13, fontFamily: "sans-serif",
      border: `1.5px solid ${color}`,
      opacity: t.visible ? 1 : 0,
      transition: "opacity 0.2s", minWidth: 200,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${color}`, overflow: "hidden", flexShrink: 0 }}>
        {profilePic
          ? <img src={profilePic} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{name?.[0]?.toUpperCase() || "?"}</div>
        }
      </div>
      <div><span style={{ fontWeight: 600 }}>{name}</span><span style={{ color: "#a1a1aa" }}> joined the board</span></div>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", marginLeft: "auto" }} />
    </div>
  ), { duration: 3000 });
};

const showLeaveToast = (name, profilePic, color) => {
  toast.custom((t) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#1e1e2e", color: "#fff",
      padding: "10px 14px", borderRadius: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      fontSize: 13, fontFamily: "sans-serif",
      border: "1.5px solid #6b7280",
      opacity: t.visible ? 1 : 0,
      transition: "opacity 0.2s", minWidth: 200,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #6b7280", overflow: "hidden", flexShrink: 0 }}>
        {profilePic
          ? <img src={profilePic} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{name?.[0]?.toUpperCase() || "?"}</div>
        }
      </div>
      <div><span style={{ fontWeight: 600 }}>{name}</span><span style={{ color: "#a1a1aa" }}> left the board</span></div>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", marginLeft: "auto" }} />
    </div>
  ), { duration: 3000 });
};


const Whiteboard = () => {
  const socket = useAuthStore((state) => state.socket);
  const authUser = useAuthStore((state) => state.authUser);
  const { roomId } = useParams();
  const navigate = useNavigate();

  const excalidrawAPIRef = useRef(null);
  const isSyncing = useRef(false);
  const lastEmitted = useRef(null);

  const [apiReady, setApiReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roomUsers, setRoomUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const cursorTimers = useRef({});

  // ─── Leave handler ────────────────────────────────────────────
  // Tells the server we left the room explicitly (before disconnect),
  // so presence updates immediately rather than waiting for socket timeout
  const handleLeave = useCallback(() => {
    if (socket) {
      socket.emit("whiteboard:leave", { roomId });
    }
    navigate("/");
  }, [socket, roomId, navigate]);

  // Also handle browser back / tab close
  useEffect(() => {
    const onBeforeUnload = () => {
      if (socket) socket.emit("whiteboard:leave", { roomId });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Cleanup when component unmounts (e.g. navigate away)
      if (socket) socket.emit("whiteboard:leave", { roomId });
    };
  }, [socket, roomId]);

  // ─── Excalidraw API ready ─────────────────────────────────────
  const handleExcalidrawAPI = useCallback((api) => {
    excalidrawAPIRef.current = api;
    setApiReady(true);
  }, []);

  // ─── Join room after API ready ────────────────────────────────
  useEffect(() => {
    if (!socket || !apiReady || !authUser) return;

    socket.emit("whiteboard:join", {
      roomId,
      name: authUser.fullName,
      profilePic: authUser.profilePic || null,
    });

    const onLoad = (elements) => {
      isSyncing.current = true;
      excalidrawAPIRef.current.updateScene({
        elements: Array.isArray(elements) ? elements : [],
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        isSyncing.current = false;
      }));
      setLoading(false);
    };

    socket.on("whiteboard:load", onLoad);
    const fallback = setTimeout(() => setLoading(false), 2000);

    return () => {
      socket.off("whiteboard:load", onLoad);
      clearTimeout(fallback);
    };
  }, [socket, roomId, apiReady, authUser]);

  // ─── Presence events ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on("whiteboard:presenceList", (users) => setRoomUsers(users));

    socket.on("whiteboard:userJoined", ({ userId, name, profilePic, users }) => {
      setRoomUsers(users);
      showJoinToast(name, profilePic, getUserColor(userId));
    });

    socket.on("whiteboard:userLeft", ({ userId, name, profilePic, users }) => {
      setRoomUsers(users);
      showLeaveToast(name, profilePic, getUserColor(userId));
    });

    return () => {
      socket.off("whiteboard:presenceList");
      socket.off("whiteboard:userJoined");
      socket.off("whiteboard:userLeft");
    };
  }, [socket]);

  // ─── Receive remote drawing ───────────────────────────────────
  useEffect(() => {
    if (!socket || !apiReady) return;

    const onReceive = (elements) => {
      if (!Array.isArray(elements)) return;
      isSyncing.current = true;
      lastEmitted.current = JSON.stringify(elements);
      excalidrawAPIRef.current.updateScene({ elements });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        isSyncing.current = false;
      }));
    };

    socket.on("whiteboard:receive", onReceive);
    return () => socket.off("whiteboard:receive", onReceive);
  }, [socket, apiReady]);

  // ─── Send local drawing ───────────────────────────────────────
  const lastEmitTime = useRef(0);

const handleChange = useCallback(
  (elements) => {
    if (!socket || isSyncing.current) return;
    const serialized = JSON.stringify(elements);
    if (serialized === lastEmitted.current) return;

    const now = Date.now();
    // throttle to max 1 emit per 80ms (~12fps) — smooth but not flooding
    if (now - lastEmitTime.current < 80) return;
    lastEmitTime.current = now;

    lastEmitted.current = serialized;
    socket.emit("whiteboard:update", { roomId, canvasData: elements });
  },
  [socket, roomId]
)
  useEffect(() => {
    if (!socket || !authUser) return;
    let lastEmitTime = 0;
    const handleMove = (e) => {
      const now = Date.now();
      if (now - lastEmitTime < 50) return;
      lastEmitTime = now;
      socket.emit("cursor:move", {
        roomId, x: e.clientX, y: e.clientY,
        name: authUser.fullName,
        profilePic: authUser.profilePic || null,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [socket, authUser, roomId]);

  // ─── Receive cursors + idle fade ─────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const onCursor = (data) => {
      setCursors((prev) => ({ ...prev, [data.userId]: { ...data, idle: false } }));
      if (cursorTimers.current[data.userId]) clearTimeout(cursorTimers.current[data.userId]);
      cursorTimers.current[data.userId] = setTimeout(() => {
        setCursors((prev) => {
          if (!prev[data.userId]) return prev;
          return { ...prev, [data.userId]: { ...prev[data.userId], idle: true } };
        });
      }, 3000);
    };
    socket.on("cursor:move", onCursor);
    return () => socket.off("cursor:move", onCursor);
  }, [socket]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied!");
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#f1f5f9] relative top-18">

      {/* HEADER */}
      <div className="h-14 bg-white flex items-center justify-between px-4 border-b shrink-0 z-10">

        <div className="flex items-center gap-3">
          {/* LEAVE BUTTON — tells server before navigating away */}
          <button
            onClick={handleLeave}
            title="Leave board"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-red-50 hover:text-red-600 text-gray-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-medium">Leave</span>
          </button>

          <span className="font-semibold text-sm flex items-center gap-2 text-gray-800">
            <Paintbrush size={16} />
            Collab Board
          </span>
        </div>

        {/* Presence avatars — center */}
        <PresenceBar users={roomUsers} myId={authUser?._id} />

        {/* Share button */}
        <button
          onClick={copyRoomId}
          className="text-xs px-3 py-1.5 bg-black text-white rounded-md flex items-center gap-1.5 hover:bg-gray-800 transition-colors"
        >
          <Share2 size={13} />
          Share
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      )}

      {/* CANVAS */}
      <div className="flex-1 relative">
        <Excalidraw
          excalidrawAPI={handleExcalidrawAPI}
          initialData={{
            elements: [],
            appState: { viewBackgroundColor: "#f1f5f9", gridSize: 20 },
          }}
          UIOptions={{
            canvasActions: { loadScene: false, saveToActiveFile: false },
          }}
          onChange={handleChange}
        />
      </div>

      {/* CURSORS */}
      {Object.values(cursors).map((c) => {
        if (!c?.userId) return null;
        const color = getUserColor(c.userId);
        return (
          <div key={c.userId} style={{
            position: "fixed", left: c.x, top: c.y,
            pointerEvents: "none", zIndex: 9999,
            transition: "left 0.05s linear, top 0.05s linear, opacity 0.6s ease",
            opacity: c.idle ? 0 : 1,
          }}>
            <CursorSVG color={color} />
            <div style={{
              marginTop: "2px", marginLeft: "14px",
              background: color, color: "#fff",
              fontSize: "11px", fontWeight: 600,
              fontFamily: "sans-serif", padding: "3px 8px",
              borderRadius: "20px", whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {c.profilePic ? (
                <img src={c.profilePic} alt={c.name} style={{
                  width: 14, height: 14, borderRadius: "50%",
                  objectFit: "cover", border: "1px solid rgba(255,255,255,0.5)",
                }} />
              ) : (
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: "rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 800,
                }}>
                  {c.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              {c.name || "user"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Whiteboard;
