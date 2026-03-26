import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const WhiteboardInvite = () => {
  const { users, getUsers } = useChatStore();
  const socket = useAuthStore.getState().socket;
  const authUser = useAuthStore.getState().authUser;
  const navigate = useNavigate();
  const { sendMessage } = useChatStore();
  const [selected, setSelected] = useState([]);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    getUsers();
  }, []);

  const toggleUser = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const sendInvite = async () => {
    if (selected.length === 0) return;
    setIsStarting(true);

    const roomId = "wb_" + Date.now();

    for (let userId of selected) {
      useChatStore.setState({ selectedUser: { _id: userId } });
      await sendMessage({
        text: "🎨 Whiteboard Invite",
        whiteboardRoomId: roomId,
      });
    }

    navigate(`/whiteboard/${roomId}`);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .wb-root {
          min-height: 110vh;
          background: #0D0D0F;
          display: flex;
          z-index : 10;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .wb-root::before {
          content: '';
          position: fixed;
          top: -40%;
          left: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .wb-root::after {
          content: '';
          position: fixed;
          bottom: -30%;
          right: -15%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .wb-card {
          width: 100%;
          max-width: 460px;
          background: #16161A;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 36px;
          position: relative;
          z-index: 1;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
        }

        .wb-header {
          margin-bottom: 32px;
        }

        .wb-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 100px;
          padding: 5px 12px;
          margin-bottom: 16px;
        }

        .wb-badge-dot {
          width: 6px;
          height: 6px;
          background: #8B5CF6;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .wb-badge span {
          font-size: 11px;
          font-weight: 500;
          color: #A78BFA;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .wb-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #F5F5F7;
          line-height: 1.15;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .wb-subtitle {
          font-size: 14px;
          color: #6B6B7A;
          margin: 0;
          line-height: 1.5;
          font-weight: 300;
        }

        .wb-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0 0 24px 0;
        }

        .wb-section-label {
          font-size: 11px;
          font-weight: 600;
          color: #4B4B5A;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 14px;
        }

        .wb-user-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 280px;
          overflow-y: auto;
          margin-bottom: 28px;
          padding-right: 4px;
        }

        .wb-user-list::-webkit-scrollbar {
          width: 3px;
        }

        .wb-user-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .wb-user-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
        }

        .wb-user-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.18s ease;
          background: transparent;
          position: relative;
          user-select: none;
        }

        .wb-user-item:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.07);
        }

        .wb-user-item.selected {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.35);
        }

        .wb-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #0D0D0F;
          flex-shrink: 0;
          font-family: 'Syne', sans-serif;
        }

        .wb-user-info {
          flex: 1;
          min-width: 0;
        }

        .wb-user-name {
          font-size: 14px;
          font-weight: 500;
          color: #E0E0E8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wb-user-status {
          font-size: 12px;
          color: #4B4B5A;
          margin-top: 2px;
          font-weight: 300;
        }

        .wb-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .wb-user-item.selected .wb-checkbox {
          background: #8B5CF6;
          border-color: #8B5CF6;
        }

        .wb-check-icon {
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .wb-user-item.selected .wb-check-icon {
          opacity: 1;
        }

        .wb-empty {
          text-align: center;
          padding: 40px 0;
          color: #4B4B5A;
          font-size: 14px;
        }

        .wb-empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
          display: block;
          opacity: 0.4;
        }

        .wb-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .wb-selected-count {
          font-size: 13px;
          color: #4B4B5A;
          font-weight: 300;
        }

        .wb-selected-count strong {
          color: #A78BFA;
          font-weight: 600;
        }

        .wb-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .wb-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .wb-btn-primary {
          background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
        }

        .wb-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(139, 92, 246, 0.4);
        }

        .wb-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .wb-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .wb-selected-avatars {
          display: flex;
          margin-left: -4px;
        }

        .wb-mini-avatar {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          border: 2px solid #16161A;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: #0D0D0F;
          margin-left: -6px;
          font-family: 'Syne', sans-serif;
        }
      `}</style>

      <div className="wb-root ">
        <div className="wb-card">
          <div className="wb-header">
            <div className="wb-badge">
              <div className="wb-badge-dot" />
              <span>Live Collaboration</span>
            </div>
            <h1 className="wb-title">Start a Whiteboard</h1>
            <p className="wb-subtitle">
              Invite teammates to join a real-time creative session.
            </p>
          </div>

          <div className="wb-divider" />

          <div className="wb-section-label">Collaborators</div>

          <div className="wb-user-list">
            {users.length === 0 ? (
              <div className="wb-empty">
                <span className="wb-empty-icon">👤</span>
                No users found
              </div>
            ) : (
              users.map((u, i) => {
                const isSelected = selected.includes(u._id);
                const color = avatarColors[i % avatarColors.length];
                return (
                  <div
                    key={u._id}
                    className={`wb-user-item ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleUser(u._id)}
                  >
                    <div
                      className="wb-avatar"
                      style={{ background: color }}
                    >
                      {getInitials(u.fullName)}
                    </div>
                    <div className="wb-user-info">
                      <div className="wb-user-name">{u.fullName}</div>
                      <div className="wb-user-status">Available</div>
                    </div>
                    <div className="wb-checkbox">
                      <svg
                        className="wb-check-icon"
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5L4.2 7.5L8 3"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="wb-footer">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {selected.length > 0 && (
                <div className="wb-selected-avatars">
                  {selected.slice(0, 3).map((id, i) => {
                    const user = users.find((u) => u._id === id);
                    const color = avatarColors[users.findIndex((u) => u._id === id) % avatarColors.length];
                    return (
                      <div
                        key={id}
                        className="wb-mini-avatar"
                        style={{ background: color, zIndex: 10 - i }}
                      >
                        {getInitials(user?.fullName)}
                      </div>
                    );
                  })}
                </div>
              )}
              <span className="wb-selected-count">
                {selected.length === 0 ? (
                  "No one selected"
                ) : (
                  <>
                    <strong>{selected.length}</strong> invited
                  </>
                )}
              </span>
            </div>

            <button
              className="wb-btn wb-btn-primary"
              onClick={sendInvite}
              disabled={selected.length === 0 || isStarting}
            >
              {isStarting ? (
                <>
                  <div className="wb-spinner" />
                  Starting…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="12" height="12" rx="2" stroke="white" strokeWidth="1.4" />
                    <path d="M4 7H10M7 4L10 7L7 10" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Launch
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WhiteboardInvite;
